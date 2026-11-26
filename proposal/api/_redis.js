// Tiny Upstash Redis REST client (no npm packages needed).
// Works with Vercel's Upstash Redis integration (KV_REST_API_* or UPSTASH_REDIS_REST_* env vars).
async function redis(cmd) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis env vars missing");
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function isAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && req.headers["x-admin-password"] === pw;
}

module.exports = { redis, isAdmin };
