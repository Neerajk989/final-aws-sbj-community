import { getStore } from "@netlify/blobs";

const STORE_NAME = "team-profile-photos";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function validMemberId(value) {
  return /^[a-z0-9-]{2,80}$/.test(value);
}

function adminAllowed(request) {
  const configured = String(process.env.TEAM_PHOTO_ADMIN_KEY || "");
  const supplied = String(request.headers.get("x-team-admin-key") || "");
  return Boolean(configured && supplied && configured === supplied);
}

export default async (request) => {
  const url = new URL(request.url);
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    try {
      const { blobs } = await store.list();
      const photos = {};

      for (const item of blobs || []) {
        if (!validMemberId(item.key)) continue;
        const value = await store.get(item.key, {
          type: "text",
          consistency: "strong"
        });
        if (value) photos[item.key] = value;
      }

      return json({
        success: true,
        count: Object.keys(photos).length,
        photos
      });
    } catch (error) {
      console.error("[Team Photos] GET failed", error);
      return json({ success: false, error: "Could not load permanent team photos." }, 500);
    }
  }

  if (request.method === "POST") {
    if (!adminAllowed(request)) {
      return json({
        success: false,
        error: process.env.TEAM_PHOTO_ADMIN_KEY
          ? "Invalid team photo admin key."
          : "TEAM_PHOTO_ADMIN_KEY is not configured in Netlify."
      }, 401);
    }

    try {
      const body = await request.json();
      const memberId = String(body.memberId || "").trim().toLowerCase();
      const photoData = body.photoData;

      if (!validMemberId(memberId)) {
        return json({ success: false, error: "Invalid member ID." }, 400);
      }

      if (typeof photoData !== "string" || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(photoData)) {
        return json({ success: false, error: "Please choose a JPG, PNG, or WEBP image from your device." }, 400);
      }

      if (photoData.length > 4_500_000) {
        return json({ success: false, error: "Photo is too large. Please choose a smaller image." }, 400);
      }

      await store.set(memberId, photoData, {
        metadata: {
          memberId,
          updatedAt: new Date().toISOString()
        }
      });

      return json({
        success: true,
        memberId,
        photoUrl: photoData
      });
    } catch (error) {
      console.error("[Team Photos] POST failed", error);
      return json({ success: false, error: "Permanent photo upload failed." }, 500);
    }
  }

  if (request.method === "DELETE") {
    if (!adminAllowed(request)) {
      return json({
        success: false,
        error: process.env.TEAM_PHOTO_ADMIN_KEY
          ? "Invalid team photo admin key."
          : "TEAM_PHOTO_ADMIN_KEY is not configured in Netlify."
      }, 401);
    }

    try {
      const memberId = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "")
        .trim()
        .toLowerCase();

      if (!validMemberId(memberId)) {
        return json({ success: false, error: "Invalid member ID." }, 400);
      }

      await store.delete(memberId);
      return json({ success: true, memberId });
    } catch (error) {
      console.error("[Team Photos] DELETE failed", error);
      return json({ success: false, error: "Could not remove permanent photo." }, 500);
    }
  }

  return json({ success: false, error: "Method not allowed." }, 405);
};
