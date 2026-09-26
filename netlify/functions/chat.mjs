function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function sseEvent(payload) {
  return "data: " + JSON.stringify(payload) + "\n\n";
}

function extractSources(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  const sources = chunks
    .map(chunk => chunk?.web)
    .filter(web => web && /^https?:\/\//i.test(web.uri || ""))
    .map(web => ({ title: web.title || web.uri, url: web.uri }));
  return sources.filter((source, index) =>
    sources.findIndex(other => other.url === source.url) === index
  ).slice(0, 5);
}

export default async (request) => {
  if (request.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    // Accept the old variable during migration because the site previously used it
    // for a Gemini key. Prefer GEMINI_API_KEY once the Netlify setting is renamed.
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({ success: false, error: "GEMINI_API_KEY is missing in Netlify environment variables." }, 503);
    }

    const payload = await request.json();
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const history = Array.isArray(payload.history) ? payload.history.slice(-12) : [];
    const pageContext = typeof payload.pageContext === "string" ? payload.pageContext.slice(0, 12000) : "";
    if (!message) return json({ success: false, error: "Message is required." }, 400);
    if (message.length > 3000) return json({ success: false, error: "Message is too long." }, 400);

    const contents = history
      .filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content.slice(0, 3000) }]
      }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const hasWebsiteContext = Boolean(pageContext.trim());
    const explicitlyCurrent = /\b(latest|today|current|currently|news|live|now|recent|price|weather|score|result|release|update|updated|2026)\b/i.test(message);
    const modelOnlyTask = /\b(write|rewrite|summarize|translate|code|program|debug|solve|calculate|equation|essay|poem|story|email|caption|algorithm|brainstorm|idea|explain)\b/i.test(message);
    const casualTask = /^(hi|hello|hey|thanks|thank you|okay|ok|bye|good morning|good evening)\b/i.test(message);
    // Google Search grounding is selected for factual questions. The model can
    // answer from website context first and search only when that is insufficient.
    const allowWebSearch = !casualTask && (explicitlyCurrent || !modelOnlyTask);

    const body = {
      systemInstruction: { parts: [{ text:
        "You are SB Jain AWS AI. Answer questions about this website from WEBSITE CONTENT first. " +
        "Preserve its names, roles, dates, and numbers exactly. If it does not answer the question, " +
        "use Google Search when available for factual or current questions, and cite relevant sources. " +
        "For coding, writing, math, study, and general explanations, answer helpfully and directly. " +
        "Never say you searched the web unless you actually did. Never invent current facts. " +
        "If a site fact is absent, say it is not listed instead of guessing. " +
        "WEBSITE CONTENT:\n" + (pageContext || "[No relevant website content found]")
      }] },
      contents,
      generationConfig: { maxOutputTokens: 1000 }
    };
    if (allowWebSearch) body.tools = [{ google_search: {} }];

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) + ":streamGenerateContent?alt=sse",
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      const details = data?.error?.message || data?.error?.status || "Gemini API error " + upstream.status;
      return json({ success: false, error: "Gemini error: " + String(details).slice(0, 300) }, upstream.status);
    }
    if (!upstream.body) return json({ success: false, error: "Gemini returned an empty response." }, 502);

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let sources = [];
        let receivedText = false;
        let finished = false;
        const emit = payload => controller.enqueue(encoder.encode(sseEvent(payload)));

        const handleBlock = block => {
          const raw = block.split("\n").filter(line => line.startsWith("data:"))
            .map(line => line.slice(5).trim()).join("\n");
          if (!raw || raw === "[DONE]") return;
          let data;
          try { data = JSON.parse(raw); } catch { return; }
          const candidate = data?.candidates?.[0];
          const text = (candidate?.content?.parts || []).map(part => part?.text || "").join("");
          if (text) {
            receivedText = true;
            emit({ type: "delta", text });
          }
          const found = extractSources(candidate);
          if (found.length) {
            sources = sources.concat(found).filter((source, index, all) =>
              all.findIndex(other => other.url === source.url) === index
            ).slice(0, 5);
          }
        };

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
            let boundary;
            while ((boundary = buffer.indexOf("\n\n")) !== -1) {
              handleBlock(buffer.slice(0, boundary));
              buffer = buffer.slice(boundary + 2);
            }
          }
          buffer += decoder.decode().replace(/\r\n/g, "\n");
          if (buffer.trim()) handleBlock(buffer);
          if (!receivedText) {
            emit({ type: "error", error: "Gemini did not return a text answer. Please try rephrasing." });
          } else {
            emit({ type: "done", sources, answerSource: sources.length ? "web" : (hasWebsiteContext ? "website" : "ai") });
          }
          finished = true;
          controller.close();
        } catch (error) {
          console.error("[AI Chat] Gemini streaming failed", error);
          if (!finished) {
            emit({ type: "error", error: "AI streaming failed. Please try again." });
            controller.close();
          }
        }
      }
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-store, must-revalidate",
        "x-accel-buffering": "no"
      }
    });
  } catch (error) {
    console.error("[AI Chat] Netlify function failed", error);
    return json({ success: false, error: "Chatbot request failed: " + (error?.message || "unknown error") }, 500);
  }
};
