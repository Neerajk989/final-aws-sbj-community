function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function sseHeaders() {
  return {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-store, must-revalidate",
    "connection": "keep-alive",
    "x-accel-buffering": "no"
  };
}

function sseEvent(payload) {
  return "data: " + JSON.stringify(payload) + "\n\n";
}

function extractSources(responseData) {
  const sources = [];
  const outputItems = Array.isArray(responseData?.output) ? responseData.output : [];

  for (const item of outputItems) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;

    for (const part of item.content) {
      if (part?.type !== "output_text" || !Array.isArray(part.annotations)) continue;

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

  return sources
    .filter((src, index, arr) =>
      src.url && arr.findIndex(item => item.url === src.url) === index
    )
    .slice(0, 5);
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
    const modelOnlyTask = /\b(write|rewrite|summarize|translate|code|program|debug|solve|calculate|equation|essay|poem|story|email|caption|algorithm|brainstorm|idea|explain)\b/i.test(message);
    const casualTask = /^(hi|hello|hey|thanks|thank you|okay|ok|bye|good morning|good evening)\b/i.test(message);

    // Website context is supplied first. Web search remains available as a fallback
    // for factual/current questions that are not answered by the page.
    const allowWebSearch = !casualTask && (explicitlyCurrent || !modelOnlyTask);

    const requestBody = {
      model: "gpt-5.6-luna",
      stream: true,
      instructions:
        "You are SB Jain AWS AI. Be fast, concise, and factual. " +
        "ROUTING RULES: " +
        "(1) WEBSITE CONTENT is the first source of truth for questions about this website, its community, team, events, FAQ, gallery, or information visibly present on the page. If the answer is in WEBSITE CONTENT, answer from it and do not contradict it with model memory. " +
        "(2) If WEBSITE CONTENT does not contain the answer, use web search when available for current, factual, real-world, or general-knowledge questions. Prefer reliable primary or authoritative sources. " +
        "(3) For coding, writing, math, debugging, study questions, explanations, brainstorming, and everyday tasks, answer directly. " +
        "(4) Never claim you searched the web unless you actually used the web-search tool. " +
        "(5) Never invent facts. " +
        "WEBSITE CONTENT:\n" + (pageContext || "[No relevant website content found]"),
      input: [
        ...safeHistory,
        {
          role: "user",
          content: [{ type: "input_text", text: message }]
        }
      ],
      max_output_tokens: 900
    };

    if (allowWebSearch) {
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

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      const upstreamMessage =
        data?.error?.message ||
        data?.error?.code ||
        ("OpenAI API error " + upstream.status);

      return json({
        success: false,
        error: "OpenAI error: " + String(upstreamMessage).slice(0, 300)
      }, upstream.status);
    }

    if (!upstream.body) {
      return json({
        success: false,
        error: "OpenAI returned an empty streaming response."
      }, 502);
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let sources = [];
        let answerSource = hasWebsiteContext ? "website" : "ai";

        const emit = (payload) => controller.enqueue(encoder.encode(sseEvent(payload)));

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let boundary;
            while ((boundary = buffer.indexOf("\n\n")) !== -1) {
              const block = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);

              const dataLines = block
                .split("\n")
                .filter(line => line.startsWith("data:"))
                .map(line => line.slice(5).trim());

              if (!dataLines.length) continue;

              const raw = dataLines.join("\n");
              if (raw === "[DONE]") continue;

              let event;
              try {
                event = JSON.parse(raw);
              } catch {
                continue;
              }

              if (event.type === "response.output_text.delta" && event.delta) {
                emit({ type: "delta", text: event.delta });
              } else if (event.type === "response.completed") {
                sources = extractSources(event.response);
                if (sources.length) answerSource = "web";
                emit({
                  type: "done",
                  sources,
                  answerSource
                });
              } else if (event.type === "error") {
                emit({
                  type: "error",
                  error: event.error?.message || "OpenAI streaming error."
                });
              }
            }
          }

          emit({ type: "done", sources, answerSource });
          controller.close();
        } catch (error) {
          console.error("[AI Chat] Streaming failed", error);
          try {
            emit({
              type: "error",
              error: error?.message || "AI streaming failed."
            });
          } finally {
            controller.close();
          }
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: sseHeaders()
    });
  } catch (error) {
    console.error("[AI Chat] Netlify function failed", error);
    return json({
      success: false,
      error: "Chatbot request failed: " + (error?.message || "unknown error")
    }, 500);
  }
};
