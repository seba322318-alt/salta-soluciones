import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";
import { generateUniqueRequestCode } from "./_request-code.mjs";

const text = (v, max = 300) => String(v || "").trim().slice(0, max);
const digits = (v) => String(v || "").replace(/[^0-9]/g, "");

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Solicitud inválida" }, { status: 400 });

  const state = await getState();
  const service = state.services.find((s) => s.id === body.serviceId && s.active !== false);
  if (!service) return Response.json({ error: "Servicio no disponible" }, { status: 400 });

  const firstName = text(body.firstName, 80);
  const lastName = text(body.lastName, 80);
  const whatsapp = text(body.whatsapp, 40).replace(/[^0-9+]/g, "");
  const address = text(body.address, 220);
  const description = text(body.description, 1200);
  if (!firstName || !lastName || !digits(whatsapp) || !address || !description) {
    return Response.json({ error: "Completá nombre, apellido, WhatsApp, dirección y descripción" }, { status: 400 });
  }
  if (body.consentContact !== true) return Response.json({ error: "Debés confirmar que aceptás recibir contacto" }, { status: 400 });

  const id = crypto.randomUUID();
  const now = new Date();
  const index = getStore({ name: "salta-request-index", consistency: "strong" });
  const code = await generateUniqueRequestCode(index);
  const record = {
    id,
    code,
    createdAt: now.toISOString(),
    channel: "Solicitud sin profesional",
    firstName,
    lastName,
    whatsapp,
    clientWhatsappDigits: digits(whatsapp),
    address,
    description,
    serviceId: service.id,
    serviceName: service.name,
    lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
    lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
    consentContact: true,
    status: "Pendiente de profesional",
    professionalId: null,
    professionalName: "",
    professionalResponse: "Pendiente",
    professionalWork: false,
    clientVisit: null,
    clientWork: null,
    clientRatingSubmitted: false,
    clientStars: null,
    updatedAt: now.toISOString()
  };

  const store = getStore({ name: "salta-requests", consistency: "strong" });
  await store.setJSON(id, record);
  await index.setJSON(code, { id });

  return Response.json({ ok: true, code, status: record.status });
};

export const config = { path: "/api/request" };
