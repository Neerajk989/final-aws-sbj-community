const OWNER = "Neerajk989";
const REPO = "final-aws-sbj-community";
const BRANCH = "main";
const MAP_PATH = "data/team-photos.json";

function corsHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function validMemberId(value) {
  return /^[a-z0-9-]{2,80}$/.test(value);
}

function rawPhotoUrl(memberId, version = "") {
  const base = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/images/team/${memberId}.jpg`;
  return version ? base + "?v=" + encodeURIComponent(version) : base;
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TEAM_PHOTO_TOKEN || "";
  const headers = {
    "accept": "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(options.headers || {})
  };
  if (token) headers.authorization = "Bearer " + token;

  return fetch("https://api.github.com/repos/" + OWNER + "/" + REPO + path, {
    ...options,
    headers
  });
}

async function getContent(path) {
  const res = await githubRequest("/contents/" + path + "?ref=" + encodeURIComponent(BRANCH));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("GitHub read failed (" + res.status + ").");
  return res.json();
}

async function readPhotoMap() {
  try {
    const item = await getContent(MAP_PATH);
    if (!item || !item.content) return {};
    const text = Buffer.from(item.content.replace(/\n/g, ""), "base64").toString("utf8");
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeContent(path, base64Content, message) {
  const token = process.env.GITHUB_TEAM_PHOTO_TOKEN || "";
  if (!token) {
    throw new Error("GITHUB_TEAM_PHOTO_TOKEN is not configured in Netlify.");
  }

  const existing = await getContent(path);
  const body = {
    message,
    content: base64Content,
    branch: BRANCH
  };
  if (existing?.sha) body.sha = existing.sha;

  const res = await githubRequest("/contents/" + path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "GitHub save failed (" + res.status + ").");
  }
  return data;
}

async function deleteContent(path, message) {
  const token = process.env.GITHUB_TEAM_PHOTO_TOKEN || "";
  if (!token) throw new Error("GITHUB_TEAM_PHOTO_TOKEN is not configured in Netlify.");

  const existing = await getContent(path);
  if (!existing?.sha) return;

  const res = await githubRequest("/contents/" + path, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      sha: existing.sha,
      branch: BRANCH
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "GitHub delete failed (" + res.status + ").");
}

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

  const url = new URL(request.url);

  if (request.method === "GET") {
    const map = await readPhotoMap();
    const photos = {};
    for (const [memberId, info] of Object.entries(map)) {
      if (!validMemberId(memberId)) continue;
      const version = typeof info === "object" ? (info.version || "") : "";
      photos[memberId] = rawPhotoUrl(memberId, version);
    }
    return json({ success: true, count: Object.keys(photos).length, photos });
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const memberId = String(body.memberId || "").trim().toLowerCase();
      const photoData = String(body.photoData || "");

      if (!validMemberId(memberId)) return json({ success: false, error: "Invalid member ID." }, 400);

      const match = photoData.match(/^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/i);
      if (!match) return json({ success: false, error: "Please choose an image from your device." }, 400);

      const bytes = Buffer.from(match[1], "base64");
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
        return json({ success: false, error: "Image must be under 5 MB after compression." }, 400);
      }

      // Frontend converts all team images to JPEG before upload.
      await writeContent(
        "images/team/" + memberId + ".jpg",
        bytes.toString("base64"),
        "Update " + memberId + " team profile photo"
      );

      const map = await readPhotoMap();
      const version = String(Date.now());
      map[memberId] = { path: "images/team/" + memberId + ".jpg", version };

      await writeContent(
        MAP_PATH,
        Buffer.from(JSON.stringify(map, null, 2) + "\n", "utf8").toString("base64"),
        "Update team photo index for " + memberId
      );

      return json({
        success: true,
        memberId,
        photoUrl: rawPhotoUrl(memberId, version),
        message: "Photo committed to GitHub and is now part of the website."
      });
    } catch (error) {
      console.error("[Team Photos] GitHub save failed", error);
      return json({ success: false, error: error.message || "Permanent photo save failed." }, 500);
    }
  }

  if (request.method === "DELETE") {
    try {
      const memberId = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "").trim().toLowerCase();
      if (!validMemberId(memberId)) return json({ success: false, error: "Invalid member ID." }, 400);

      await deleteContent("images/team/" + memberId + ".jpg", "Remove " + memberId + " team profile photo");
      const map = await readPhotoMap();
      delete map[memberId];
      await writeContent(
        MAP_PATH,
        Buffer.from(JSON.stringify(map, null, 2) + "\n", "utf8").toString("base64"),
        "Remove team photo index for " + memberId
      );

      return json({ success: true, memberId });
    } catch (error) {
      console.error("[Team Photos] GitHub delete failed", error);
      return json({ success: false, error: error.message || "Permanent photo removal failed." }, 500);
    }
  }

  return json({ success: false, error: "Method not allowed." }, 405);
};
