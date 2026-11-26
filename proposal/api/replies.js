const { redis, isAdmin } = require("./_redis");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    // She sends a letter (public)
    if (req.method === "POST") {
      const body = req.body || {};
      const text = String(body.text || "").trim().slice(0, 8000);
      const name = String(body.name || "").trim().slice(0, 80);
      if (!text) return res.status(400).json({ error: "empty" });
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name,
        text,
        at: new Date().toISOString(),
      };
      await redis(["LPUSH", "replies", JSON.stringify(item)]);
      await redis(["LTRIM", "replies", "0", "499"]);
      return res.status(200).json({ ok: true });
    }

    // Only you can read / delete
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });

    if (req.method === "GET") {
      const list = await redis(["LRANGE", "replies", "0", "-1"]);
      return res.status(200).json({ replies: (list || []).map((s) => JSON.parse(s)) });
    }
    if (req.method === "DELETE") {
      const id = String((req.body && req.body.id) || "");
      const list = await redis(["LRANGE", "replies", "0", "-1"]);
      for (const s of list || []) {
        if (JSON.parse(s).id === id) await redis(["LREM", "replies", "1", s]);
      }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
