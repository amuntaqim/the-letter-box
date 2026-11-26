const { redis, isAdmin } = require("./_redis");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const raw = await redis(["GET", "letter"]);
      return res.status(200).json(raw ? JSON.parse(raw) : { html: "", updatedAt: null });
    }
    if (req.method === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
      const html = String((req.body && req.body.html) || "");
      if (html.length > 200000) return res.status(413).json({ error: "too large" });
      const data = { html, updatedAt: new Date().toISOString() };
      await redis(["SET", "letter", JSON.stringify(data)]);
      return res.status(200).json({ ok: true, updatedAt: data.updatedAt });
    }
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
