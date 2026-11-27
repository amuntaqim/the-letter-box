const { clearCookie, send } = require("./_lib");

module.exports = (req, res) => {
  res.setHeader("Set-Cookie", clearCookie());
  send(res, 200, { ok: true });
};
