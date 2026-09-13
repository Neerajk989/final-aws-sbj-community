import crypto from "node:crypto";

export const ADMIN_COOKIE = "team_admin_session";
const SESSION_HOURS = 8;

function env(name) {
  return String(process.env[name] || "").trim();
}

export function allowedAdminEmails() {
  return env("TEAM_ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function sessionSecret() {
  return env("TEAM_ADMIN_SESSION_SECRET");
}

export function adminPassword() {
  return env("TEAM_ADMIN_PASSWORD");
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  const secret = sessionSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function safeEqualText(a, b) {
  return safeEqual(a, b);
}

export function isAllowedAdmin(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return !!normalized && allowedAdminEmails().includes(normalized);
}

export function issueAdminSession(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!isAllowedAdmin(normalized) || !sessionSecret()) return null;

  const payload = {
    email: normalized,
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000
  };
  const encoded = b64url(JSON.stringify(payload));
  const signature = sign(encoded);
  if (!signature) return null;

  return {
    token: encoded + "." + signature,
    email: normalized,
    maxAge: SESSION_HOURS * 60 * 60
  };
}

export function readCookie(request, name = ADMIN_COOKIE) {
  const raw = request.headers.get("cookie") || "";
  const pairs = raw.split(";");
  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index < 0) continue;
    const key = pair.slice(0, index).trim();
    if (key !== name) continue;
    return decodeURIComponent(pair.slice(index + 1).trim());
  }
  return "";
}

export function verifySessionToken(token) {
  try {
    const [encoded, signature] = String(token || "").split(".");
    if (!encoded || !signature || !sessionSecret()) return null;

    const expected = sign(encoded);
    if (!expected || !safeEqual(signature, expected)) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    const email = String(payload.email || "").trim().toLowerCase();
    const exp = Number(payload.exp || 0);

    if (!email || !isAllowedAdmin(email) || !Number.isFinite(exp) || exp <= Date.now()) {
      return null;
    }

    return { email, exp };
  } catch {
    return null;
  }
}

export function verifyAdminRequest(request) {
  return verifySessionToken(readCookie(request));
}

export function sessionCookie(token, maxAge) {
  return [
    ADMIN_COOKIE + "=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=" + String(maxAge)
  ].join("; ");
}

export function clearSessionCookie() {
  return [
    ADMIN_COOKIE + "=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=0"
  ].join("; ");
}

export function adminConfigReady() {
  return allowedAdminEmails().length > 0 && !!adminPassword() && !!sessionSecret();
}
