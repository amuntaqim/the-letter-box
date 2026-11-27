// Shared helpers for the API (files starting with "_" are not exposed as routes)
const crypto = require("crypto");

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.SESSION_SECRET || "";
const COOKIE = "hem_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function redis(cmd) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error("storage-not-configured");
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + REDIS_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function b64(s) { return Buffer.from(s).toString("base64url"); }
function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeCookie(role) {
  const payload = b64(JSON.stringify({ role, exp: Date.now() + MAX_AGE * 1000 }));
  return `${COOKIE}=${payload}.${sign(payload)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`;
}

function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function getRole(req) {
  if (!SECRET) return null;
  const header = req.headers.cookie || "";
  const m = header.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!m) return null;
  const val = m.slice(COOKIE.length + 1);
  const [payload, sig] = val.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data.role === "he" || data.role === "she" ? data.role : null;
  } catch (e) { return null; }
}

function sha(s) { return crypto.createHash("sha256").update(String(s)).digest(); }
function safeEqual(a, b) { return crypto.timingSafeEqual(sha(a), sha(b)); }

function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) { try { return JSON.parse(req.body); } catch (e) {} }
  return {};
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

module.exports = { redis, makeCookie, clearCookie, getRole, safeEqual, readJson, send };
