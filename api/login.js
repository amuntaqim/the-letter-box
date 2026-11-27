const { redis, makeCookie, safeEqual, readJson, send } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "method" });
  if (!process.env.SESSION_SECRET || !process.env.PASSWORD_HE || !process.env.PASSWORD_SHE) {
    return send(res, 500, { error: "not-configured" });
  }
  try {
    // simple brute-force guard: 10 tries per 15 minutes per IP
    const ip = String(req.headers["x-forwarded-for"] || "ip").split(",")[0].trim();
    const key = "hem:rl:" + ip;
    const tries = await redis(["INCR", key]);
    if (tries === 1) await redis(["EXPIRE", key, 900]);
    if (tries > 10) return send(res, 429, { error: "too-many" });

    const { password } = readJson(req);
    if (typeof password !== "string" || !password) return send(res, 400, { error: "password" });

    let role = null;
    if (safeEqual(password, process.env.PASSWORD_HE)) role = "he";
    else if (safeEqual(password, process.env.PASSWORD_SHE)) role = "she";
    if (!role) return send(res, 401, { error: "wrong" });

    await redis(["DEL", key]);
    res.setHeader("Set-Cookie", makeCookie(role));
    return send(res, 200, { role });
  } catch (e) {
    return send(res, 500, { error: "server" });
  }
};
