import {
  adminConfigReady,
  adminPassword,
  clearSessionCookie,
  isAllowedAdmin,
  issueAdminSession,
  safeEqualText,
  sessionCookie,
  verifyAdminRequest
} from "./lib/team-admin-session.mjs";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

export default async (request) => {
  if (request.method === "GET") {
    const session = verifyAdminRequest(request);
    if (!session) {
      return json({ success: true, authenticated: false });
    }

    return json({
      success: true,
      authenticated: true,
      email: session.email,
      expiresAt: session.exp
    });
  }

  if (request.method === "POST") {
    try {
      if (!adminConfigReady()) {
        return json({
          success: false,
          error: "Team Admin is not configured yet. Add TEAM_ADMIN_EMAILS, TEAM_ADMIN_PASSWORD and TEAM_ADMIN_SESSION_SECRET in Netlify."
        }, 503);
      }

      const body = await request.json();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!isAllowedAdmin(email) || !safeEqualText(password, adminPassword())) {
        return json({ success: false, error: "Invalid email or password." }, 401);
      }

      const session = issueAdminSession(email);
      if (!session) {
        return json({ success: false, error: "Could not create admin session." }, 500);
      }

      return json({
        success: true,
        authenticated: true,
        email: session.email
      }, 200, {
        "set-cookie": sessionCookie(session.token, session.maxAge)
      });
    } catch {
      return json({ success: false, error: "Invalid login request." }, 400);
    }
  }

  if (request.method === "DELETE") {
    return json({ success: true, authenticated: false }, 200, {
      "set-cookie": clearSessionCookie()
    });
  }

  return json({ success: false, error: "Method not allowed." }, 405);
};
