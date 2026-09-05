import { getState } from "./_state.mjs";
import { slugify } from "./_defaults.mjs";
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export default async (req) => {
  const origin = String(process.env.PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/,'');
  const state = await getState();
  const urls=[`${origin}/`, ...(state.services||[]).filter(s=>s.active!==false).map(s=>`${origin}/servicios/${s.slug||slugify(s.name)}-salta`)];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u,i)=>`  <url><loc>${esc(u)}</loc><changefreq>${i?'weekly':'daily'}</changefreq><priority>${i?'0.8':'1.0'}</priority></url>`).join('\n')}\n</urlset>`;
  return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600"}});
};
export const config={path:"/sitemap.xml"};
