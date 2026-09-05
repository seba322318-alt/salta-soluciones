import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";

const text = (v, max = 600) => String(v || "").trim().slice(0, max);

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  const state = await getState();
  const professional = state.professionals.find((p) => p.id === body?.professionalId && p.status === "Activo");
  const stars = Number(body?.stars);
  const comment = text(body?.comment, 800);
  if (!professional || !Number.isInteger(stars) || stars < 1 || stars > 5) return Response.json({ error: "Calificación inválida" }, { status: 400 });
  if (stars <= 3 && !comment) return Response.json({ error: "Con 1, 2 o 3 estrellas, contanos brevemente qué ocurrió" }, { status: 400 });
  const id = crypto.randomUUID();
  const rating = {
    id,
    createdAt: new Date().toISOString(),
    professionalId: professional.id,
    professionalName: professional.name,
    stars,
    comment,
    requestCode: text(body?.requestCode, 60),
    approved: false
  };
  const store = getStore({ name: "salta-ratings", consistency: "strong" });
  await store.setJSON(id, rating);
  return Response.json({ ok: true, message: "Calificación recibida y pendiente de revisión." });
};

export const config = { path: "/api/rating" };
