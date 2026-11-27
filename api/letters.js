const { redis, getRole, readJson, send } = require("./_lib");

const HASH = "hem:letters";
const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

async function all() {
  const flat = await redis(["HGETALL", HASH]);
  const out = [];
  for (let i = 1; i < (flat || []).length; i += 2) {
    try { out.push(JSON.parse(flat[i])); } catch (e) {}
  }
  return out;
}

async function one(id) {
  const v = await redis(["HGET", HASH, id]);
  return v ? JSON.parse(v) : null;
}

module.exports = async (req, res) => {
  const role = getRole(req);
  if (!role) return send(res, 401, { error: "auth" });

  try {
    // ---- list: my letters (drafts + sent) and letters sent to me ----
    if (req.method === "GET") {
      const letters = (await all())
        .filter((l) => l.author === role || l.status === "sent")
        .sort((a, b) => (b.sentAt || b.ts) - (a.sentAt || a.ts));
      return send(res, 200, { role, letters });
    }

    // ---- create / update a draft, or send ----
    if (req.method === "POST") {
      const data = readJson(req);

      if (data.action === "read") {
        const l = await one(String(data.id || ""));
        if (!l || l.author === role || l.status !== "sent") return send(res, 404, { error: "none" });
        if (!l.readAt) { l.readAt = Date.now(); await redis(["HSET", HASH, l.id, JSON.stringify(l)]); }
        return send(res, 200, { letter: l });
      }

      const body = clip(data.body, 20000);
      if (!body.trim()) return send(res, 400, { error: "empty" });

      const now = Date.now();
      let letter;
      if (data.id) {
        letter = await one(String(data.id));
        if (!letter || letter.author !== role) return send(res, 404, { error: "none" });
      } else {
        letter = { id: "l" + now + Math.random().toString(36).slice(2, 6), author: role, ts: now, status: "draft", readAt: null };
      }
      letter.sal = clip(data.sal, 200);
      letter.body = body;
      letter.sign = clip(data.sign, 200);
      letter.edited = now;
      if (letter.status === "sent") letter.editedAt = now; // edited after sending
      else if (data.send) { letter.status = "sent"; letter.sentAt = now; }

      await redis(["HSET", HASH, letter.id, JSON.stringify(letter)]);
      return send(res, 200, { letter });
    }

    // ---- delete my own letter ----
    if (req.method === "DELETE") {
      const id = String((req.query && req.query.id) || "");
      const l = await one(id);
      if (!l || l.author !== role) return send(res, 404, { error: "none" });
      if (l.status === "sent") return send(res, 403, { error: "sent" }); // a sent letter cannot be unsent
      await redis(["HDEL", HASH, id]);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "method" });
  } catch (e) {
    return send(res, 500, { error: e.message === "storage-not-configured" ? "storage" : "server" });
  }
};
