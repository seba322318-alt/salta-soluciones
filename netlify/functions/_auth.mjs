const enc = new TextEncoder();

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return b64url(new Uint8Array(sig));
}

export async function createSessionToken(secret) {
  const payload = `${Date.now() + 8 * 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${await sign(payload, secret)}`;
}

function parseCookie(cookie = "") {
  const out = {};
  for (const pair of cookie.split(";")) {
    const i = pair.indexOf("=");
    if (i > -1) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return out;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await sign(payload, secret);
  if (expected.length !== parts[2].length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts[2].charCodeAt(i);
  if (diff !== 0) return false;
  const exp = Number(parts[0]);
  return Number.isFinite(exp) && exp > Date.now();
}

export async function requireAdmin(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const cookies = parseCookie(req.headers.get("cookie") || "");
  return verifySessionToken(cookies.ss_admin, secret);
}
