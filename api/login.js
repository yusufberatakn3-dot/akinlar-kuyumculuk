import crypto from "crypto";

const PASSWORD = "1532467980Bb.";
const SECRET = "AKINLAR-GUVENLIK-2026";

function sign(value) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body || {};

  if (password !== PASSWORD) {
    return res.status(401).json({ error: "Şifre yanlış" });
  }

  const expires = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const token = `${expires}.${sign(String(expires))}`;

  res.setHeader(
    "Set-Cookie",
    `price_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
  );

  return res.status(200).json({ ok: true });
}
