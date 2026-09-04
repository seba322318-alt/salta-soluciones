export default async (req) => {
  const origin = new URL(req.url).origin;
  const body = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /acceso.html\nDisallow: /api/admin/\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
};
export const config = { path: "/robots.txt" };
