import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_auth.mjs";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default async (req) => {
  if (!(await requireAdmin(req))) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No se recibió una imagen" }, { status: 400 });
  if (!allowed.has(file.type)) return Response.json({ error: "Formato no permitido. Usá JPG, PNG, WEBP o GIF." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "La imagen supera 5 MB" }, { status: 400 });
  const ext = (file.name.split(".").pop() || "img").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const key = `${crypto.randomUUID()}.${ext}`;
  const store = getStore({ name: "salta-images", consistency: "strong" });
  await store.set(key, file, { metadata: { contentType: file.type, filename: file.name } });
  return Response.json({ ok: true, url: `/api/image/${key}` });
};

export const config = { path: "/api/admin/upload" };
