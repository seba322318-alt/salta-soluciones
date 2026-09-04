import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const key = context.params?.key;
  if (!key) return new Response("Not found", { status: 404 });
  const store = getStore({ name: "salta-images", consistency: "strong" });
  const result = await store.getWithMetadata(key, { type: "blob", consistency: "strong" });
  if (!result) return new Response("Not found", { status: 404 });
  const contentType = result.metadata?.contentType || result.data?.type || "application/octet-stream";
  return new Response(result.data, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" } });
};

export const config = { path: "/api/image/:key" };
