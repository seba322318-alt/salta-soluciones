import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";

const text = (v, max = 800) => String(v || "").trim().slice(0, max);
const digits = (v) => String(v || "").replace(/[^0-9]/g, "");
const phonesMatch = (a,b) => {
  const x=digits(a), y=digits(b); if(!x||!y) return false; if(x===y) return true;
  return x.length>=10 && y.length>=10 && x.slice(-10)===y.slice(-10);
};

async function findRequest(code) {
  const requestStore = getStore({ name: "salta-requests", consistency: "strong" });
  const index = getStore({ name: "salta-request-index", consistency: "strong" });
  const hit = await index.get(code, { type: "json", consistency: "strong" });
  if (hit?.id) {
    const row = await requestStore.get(hit.id, { type: "json", consistency: "strong" });
    if (row) return { row, requestStore };
  }
  const { blobs } = await requestStore.list();
  for (const item of blobs.slice(-1000).reverse()) {
    const row = await requestStore.get(item.key, { type: "json", consistency: "strong" });
    if (row?.code === code) { await index.setJSON(code, { id: row.id || item.key }); return { row, requestStore }; }
  }
  return { row: null, requestStore };
}

function publicRequest(row, state) {
  const professional = state.professionals.find(p=>p.id===row.professionalId);
  return {
    code: row.code, createdAt: row.createdAt, serviceName: row.serviceName,
    professionalName: row.professionalName || professional?.name || "Pendiente de asignación",
    hasProfessional: Boolean(row.professionalId),
    status: row.status || "Contacto iniciado", clientVisit: row.clientVisit ?? null,
    clientWork: row.clientWork ?? null, clientRatingSubmitted: row.clientRatingSubmitted === true,
    clientStars: Number(row.clientStars) || null
  };
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  const rawCode = text(body.code, 80);
  const code = rawCode.replace(/[^0-9]/g, "");
  const whatsapp = text(body.whatsapp, 50);
  if (!/^\d{5}$/.test(code)) return Response.json({ error: "El número de solicitud debe tener 5 dígitos" }, { status: 400 });
  if (!whatsapp) return Response.json({ error: "Ingresá tu WhatsApp" }, { status: 400 });
  const { row, requestStore } = await findRequest(code);
  if (!row || !phonesMatch(whatsapp, row.clientWhatsappDigits || row.whatsapp)) return Response.json({ error: "No encontramos una solicitud con esos datos" }, { status: 404 });
  const state = await getState();
  const action = body.action || "lookup";
  if (action !== "lookup" && !row.professionalId) return Response.json({ error: "Todavía no hay un profesional asignado a esta solicitud" }, { status: 400 });

  if (action === "confirmVisit") {
    const value = body.value === true;
    row.clientVisit = value; row.clientVisitUpdatedAt = new Date().toISOString();
    if (!value) { row.clientWork = null; row.status = "No asistió"; }
    else if (row.clientWork == null) row.status = "Visita confirmada";
    row.updatedAt = new Date().toISOString(); await requestStore.setJSON(row.id, row);
  } else if (action === "confirmWork") {
    if (row.clientVisit !== true) return Response.json({ error: "Primero confirmá que el profesional asistió" }, { status: 400 });
    const value = body.value === true;
    row.clientWork = value; row.clientWorkUpdatedAt = new Date().toISOString(); row.status = value ? (row.professionalWork === true ? "Trabajo confirmado" : "Trabajo realizado") : "No concretado";
    row.updatedAt = new Date().toISOString(); await requestStore.setJSON(row.id, row);
  } else if (action === "rate") {
    if (row.clientWork !== true) return Response.json({ error: "Solo se puede calificar un trabajo confirmado como realizado" }, { status: 400 });
    if (row.clientRatingSubmitted === true) return Response.json({ error: "Esta solicitud ya fue calificada" }, { status: 409 });
    const stars = Number(body.stars); const comment = text(body.comment, 800);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return Response.json({ error: "Calificación inválida" }, { status: 400 });
    if (stars <= 3 && !comment) return Response.json({ error: "Con 1, 2 o 3 estrellas, contanos brevemente qué ocurrió" }, { status: 400 });
    const professional = state.professionals.find(p=>p.id===row.professionalId);
    if (!professional) return Response.json({ error: "Profesional no disponible" }, { status: 400 });
    const ratingStore = getStore({ name: "salta-ratings", consistency: "strong" });
    const rating = { id:`request-${row.id}`, requestId:row.id, requestCode:row.code, createdAt:new Date().toISOString(), professionalId:professional.id, professionalName:professional.name, stars, comment, approved:false };
    await ratingStore.setJSON(rating.id, rating);
    row.clientRatingSubmitted = true; row.clientStars = stars; row.clientRatedAt = rating.createdAt; row.updatedAt = rating.createdAt;
    await requestStore.setJSON(row.id, row);
  } else if (action !== "lookup") {
    return Response.json({ error: "Acción no reconocida" }, { status: 400 });
  }

  return Response.json({ ok:true, request: publicRequest(row, state) }, { headers:{"Cache-Control":"no-store"} });
};

export const config = { path: "/api/client-status" };
