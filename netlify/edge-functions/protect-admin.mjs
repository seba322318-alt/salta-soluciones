const enc = new TextEncoder();

function parseCookie(cookie = "") {
  const out = {};
  for (const pair of cookie.split(";")) {
    const i = pair.indexOf("=");
    if (i > -1) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return out;
}

function b64url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return b64url(new Uint8Array(sig));
}

async function valid(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await sign(payload, secret);
  if (expected.length !== parts[2].length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts[2].charCodeAt(i);
  return diff === 0 && Number(parts[0]) > Date.now();
}

export default async (request, context) => {
  const secret = Netlify.env.get("SESSION_SECRET");
  const cookies = parseCookie(request.headers.get("cookie") || "");
  if (!(await valid(cookies.ss_admin, secret))) {
    return Response.redirect(new URL("/acceso.html", request.url), 302);
  }
  return context.next();
};
