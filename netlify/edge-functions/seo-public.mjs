export default async (request, context) => {
  const response = await context.next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const url=new URL(request.url);
  if (!(url.pathname==='/' || url.pathname==='/index.html')) return response;
  let html=await response.text();
  const configured=Netlify.env.get("PUBLIC_SITE_URL");
  const origin=String(configured||url.origin).replace(/\/$/,'');
  const canonical=`${origin}/`;
  const schema={"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":`${origin}/#organization`,name:"Salta Soluciones",url:canonical,logo:`${origin}/assets/logo.png`,areaServed:"Salta Capital, Argentina"},{"@type":"WebSite","@id":`${origin}/#website`,url:canonical,name:"Salta Soluciones",publisher:{"@id":`${origin}/#organization`}}]};
  const inject=`<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
  html=html.replace('<!-- SEO_DYNAMIC_HEAD -->',inject);
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
};
