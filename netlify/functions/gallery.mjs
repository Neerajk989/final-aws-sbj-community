import { getStore } from "@netlify/blobs";

const STORE_NAME = "event-gallery";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function cleanText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function validId(value) {
  return /^gal-[a-z0-9-]{8,100}$/i.test(value);
}

function formatDate(value) {
  const raw = value || new Date().toISOString().slice(0, 10);
  const d = new Date(raw + (raw.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async (request) => {
  const url = new URL(request.url);
  const store = getStore(STORE_NAME);

  if (request.method === "GET") {
    try {
      const { blobs } = await store.list();
      const items = [];

      for (const blob of blobs || []) {
        if (!String(blob.key || "").startsWith("item-")) continue;
        const raw = await store.get(blob.key, { type: "text" });
        if (!raw) continue;
        try {
          const item = JSON.parse(raw);
          if (item && item.id) items.push(item);
        } catch {}
      }

      items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      return json({ success: true, count: items.length, items });
    } catch (error) {
      console.error("[Gallery] GET failed", error);
      return json({ success: false, error: "Could not load gallery." }, 500);
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const title = cleanText(body.title, 120);
      const category = cleanText(body.category, 40).toLowerCase() || "workshops";
      const categoryLabel = cleanText(body.categoryLabel, 60) || category;
      const date = cleanText(body.date, 30) || new Date().toISOString().slice(0, 10);
      const location = cleanText(body.location, 180) || "SB Jain Institute of Technology, Nagpur";
      const caption = cleanText(body.caption, 1000);
      const imageData = typeof body.imageData === "string" ? body.imageData : "";
      const inputUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

      if (!title) return json({ success: false, error: "Event title is required." }, 400);

      let imageUrl = "";
      if (imageData) {
        if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageData)) {
          return json({ success: false, error: "Unsupported image format." }, 400);
        }
        if (imageData.length > 5_000_000) {
          return json({ success: false, error: "Image is too large after compression." }, 400);
        }
        imageUrl = imageData;
      } else if (/^https:\/\//i.test(inputUrl)) {
        imageUrl = inputUrl;
      } else {
        return json({ success: false, error: "Please upload an event image or use an HTTPS image URL." }, 400);
      }

      const id = "gal-" + Date.now().toString(36) + "-" + crypto.randomUUID().slice(0, 8);
      const item = {
        id,
        title,
        category,
        categoryLabel,
        date,
        dateFormatted: formatDate(date),
        location,
        caption,
        imageUrl,
        createdAt: new Date().toISOString()
      };

      await store.set("item-" + id, JSON.stringify(item), {
        metadata: { id, category, createdAt: item.createdAt }
      });

      return json({ success: true, item }, 201);
    } catch (error) {
      console.error("[Gallery] POST failed", error);
      return json({ success: false, error: "Permanent event photo upload failed." }, 500);
    }
  }

  if (request.method === "DELETE") {
    try {
      const id = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
      if (!validId(id)) return json({ success: false, error: "Invalid gallery item ID." }, 400);

      await store.delete("item-" + id);
      return json({ success: true, id });
    } catch (error) {
      console.error("[Gallery] DELETE failed", error);
      return json({ success: false, error: "Could not delete gallery item." }, 500);
    }
  }

  return json({ success: false, error: "Method not allowed." }, 405);
};
