export default async (req) => {
  const origin=String(process.env.PUBLIC_SITE_URL||new URL(req.url).origin).replace(/\/$/,'');
  const body=`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /acceso.html\nDisallow: /profesional.html\nDisallow: /api/admin/\nDisallow: /api/client-status\nDisallow: /api/professional-portal\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=3600"}});
};
export const config={path:"/robots.txt"};
