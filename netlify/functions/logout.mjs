export default async () => Response.json({ ok: true }, {
  headers: { "Set-Cookie": "ss_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0", "Cache-Control": "no-store" }
});
export const config = { path: "/api/admin/logout" };
