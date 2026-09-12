function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function extractReply(data) {
  const outputItems = Array.isArray(data?.output) ? data.output : [];
  const textParts = [];
  const sources = [];

  for (const item of outputItems) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && part.text) {
          textParts.push(part.text);
          if (Array.isArray(part.annotations)) {
            for (const ann of part.annotations) {
              if (ann?.type === "url_citation" && ann.url) {
                sources.push({
                  title: ann.title || ann.url,
                  url: ann.url
                });
              }
            }
          }
        }
      }
    }
  }

  const uniqueSources = sources.filter((src, index, arr) =>
    src.url && arr.findIndex(x => x.url === src.url) === index
  ).slice(0, 5);

  return {
    reply: textParts.join("\n").trim() || "Sorry, I could not generate a response.",
    sources: uniqueSources
  };
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({
        success: false,
        error: "OPENAI_API_KEY is missing in Netlify environment variables."
      }, 503);
    }

    const payload = await request.json();
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const history = Array.isArray(payload.history) ? payload.history.slice(-12) : [];
    const pageContext = typeof payload.pageContext === "string"
      ? payload.pageContext.slice(0, 12000)
      : "";

    if (!message) {
      return json({ success: false, error: "Message is required." }, 400);
    }

    if (message.length > 3000) {
      return json({ success: false, error: "Message is too long." }, 400);
    }

    const safeHistory = history
      .filter(item =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      )
      .map(item => ({
        role: item.role,
        content: [{
          type: item.role === "assistant" ? "output_text" : "input_text",
          text: item.content.slice(0, 3000)
        }]
      }));

    const hasWebsiteContext = Boolean(pageContext && pageContext.trim());
    const explicitlyCurrent = /\b(latest|today|current|currently|news|live|now|recent|price|weather|score|result|release|update|updated|2026)\b/i.test(message);
    const externalFactQuestion = /\b(who|what|where|when|which|how many|how much|president|prime minister|company|country|city|college|university|product|service|version|date|time|meaning|definition|history|founder|ceo|owner)\b/i.test(message);
    const modelOnlyTask = /\b(write|rewrite|summarize|translate|code|program|debug|solve|calculate|equation|essay|poem|story|email|caption|algorithm)\b/i.test(message);

    // Website questions: use website context exactly when it contains the answer.
    // Outside factual/current questions: verify on the web.
    // Coding/writing/math: answer directly for speed.
    const needsWeb = !hasWebsiteContext && (explicitlyCurrent || (externalFactQuestion && !modelOnlyTask));

    const requestBody = {
      model: "gpt-5.6-luna",
      instructions:
        "You are SB Jain AWS AI. Be fast, concise, and factual. " +
        "ROUTING RULES: " +
        "(1) If WEBSITE CONTENT is provided and it contains the answer, answer from that website content only. Preserve names, roles, dates, labels, numbers, and wording exactly when possible. Do not replace a website fact with model memory. " +
        "(2) If the answer is not present in WEBSITE CONTENT and the user asks an external factual, current, real-world, or verifiable question, use web search and answer from the search results. " +
        "(3) For coding, writing, math, debugging, and general explanations that do not need fresh facts, answer directly without web search for speed. " +
        "(4) Never invent facts. If website content is insufficient and search is unavailable or inconclusive, say you could not verify it. " +
        "(5) When web search is used, give a short answer first and include source links. " +
        "(6) For website questions, do not say you searched the web unless you actually did. " +
        "WEBSITE CONTENT:\n" + (pageContext || "[No relevant website content found]"),
      input: [
        ...safeHistory,
        {
          role: "user",
          content: [{ type: "input_text", text: message }]
        }
      ],
      max_output_tokens: 700,
      metadata: {
        mode: needsWeb ? "verified_web" : (hasWebsiteContext ? "website_grounded" : "general")
      }
    };

    if (needsWeb) {
      requestBody.tools = [{ type: "web_search" }];
      requestBody.tool_choice = "auto";
    }

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "authorization": "Bearer " + apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const upstreamMessage =
        data?.error?.message ||
        data?.error?.code ||
        ("OpenAI API error " + upstream.status);

      return json({
        success: false,
        error: "OpenAI error: " + String(upstreamMessage).slice(0, 260)
      }, upstream.status);
    }

    const parsed = extractReply(data);

    return json({
      success: true,
      reply: parsed.reply,
      sources: parsed.sources,
      answerSource: hasWebsiteContext ? "website" : (needsWeb ? "web" : "ai")
    });
  } catch (error) {
    console.error("[AI Chat] Netlify function failed", error);
    return json({
      success: false,
      error: "Chatbot request failed: " + (error?.message || "unknown error")
    }, 500);
  }
};
