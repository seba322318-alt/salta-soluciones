import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";

const text = (v, max = 500) => String(v || "").trim().slice(0, max);

async function listRequests(professionalId, limit = 200) {
  const store = getStore({ name: "salta-requests", consistency: "strong" });
  const { blobs } = await store.list();
  const rows = [];
  for (const item of blobs.slice(-1000).reverse()) {
    const row = await store.get(item.key, { type: "json", consistency: "strong" });
    if (row?.professionalId === professionalId) rows.push(row);
    if (rows.length >= limit) break;
  }
  return { rows, store };
}

function publicRow(r) {
  return {
    id: r.id, code: r.code, createdAt: r.createdAt, firstName: r.firstName, lastName: r.lastName,
    whatsapp: r.whatsapp, address: r.address, description: r.description, serviceName: r.serviceName,
    lat: r.lat, lng: r.lng, status: r.status || "Contacto iniciado",
    professionalResponse: r.professionalResponse || "Pendiente", professionalWork: r.professionalWork === true,
    clientVisit: r.clientVisit ?? null, clientWork: r.clientWork ?? null, clientStars: Number(r.clientStars) || null
  };
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  const token = text(body.token, 180);
  if (!token) return Response.json({ error: "Enlace privado inválido" }, { status: 401 });
  const state = await getState();
  const professional = (state.professionals || []).find(p => p.portalToken === token);
  if (!professional) return Response.json({ error: "Enlace privado inválido" }, { status: 401 });

  const { rows, store } = await listRequests(professional.id);
  const action = body.action || "list";
  if (action !== "list") {
    const id = text(body.id, 120);
    const row = rows.find(r => r.id === id);
    if (!row) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });
    const now = new Date().toISOString();
    if (action === "accept") {
      row.professionalResponse = "Aceptó"; row.professionalResponseAt = now;
      if (row.clientWork === true) row.status = "Trabajo confirmado";
      else if (row.clientVisit === true) row.status = "Visita confirmada";
      else row.status = "Profesional aceptó";
    } else if (action === "reject") {
      row.professionalResponse = "Rechazó"; row.professionalResponseAt = now; row.status = "Profesional rechazó";
    } else if (action === "complete") {
      row.professionalResponse = "Aceptó";
      row.professionalWork = true; row.professionalWorkUpdatedAt = now;
      row.status = row.clientWork === true ? "Trabajo confirmado" : "Profesional indicó finalizado";
    } else return Response.json({ error: "Acción no reconocida" }, { status: 400 });
    row.updatedAt = now;
    await store.setJSON(row.id, row);
  }

  const fresh = (await listRequests(professional.id)).rows;
  return Response.json({ ok: true, professional: { name: professional.name }, requests: fresh.map(publicRow) }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/professional-portal" };
