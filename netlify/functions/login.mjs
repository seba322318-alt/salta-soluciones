import { createSessionToken } from "./_auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) return Response.json({ error: "Faltan ADMIN_PASSWORD y/o SESSION_SECRET en Netlify." }, { status: 500 });
  const body = await req.json().catch(() => null);
  if (!body || String(body.password || "") !== password) return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  const token = await createSessionToken(secret);
  return Response.json({ ok: true }, {
    headers: {
      "Set-Cookie": `ss_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
      "Cache-Control": "no-store"
    }
  });
};

export const config = { path: "/api/admin/login" };
