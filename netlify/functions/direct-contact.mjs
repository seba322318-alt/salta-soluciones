import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";
import { generateUniqueRequestCode } from "./_request-code.mjs";

const text = (v, max = 500) => String(v || "").trim().slice(0, max);
const digits = (v) => String(v || "").replace(/[^0-9]/g, "");

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  const state = await getState();
  const professional = state.professionals.find((p) => p.id === body.professionalId && p.status === "Activo");
  if (!professional) return Response.json({ error: "Profesional no disponible" }, { status: 400 });
  const service = state.services.find((s) => s.id === body.serviceId && s.active !== false && (professional.serviceIds || []).includes(s.id));
  if (!service) return Response.json({ error: "Servicio no disponible para este profesional" }, { status: 400 });

  const firstName = text(body.firstName, 80);
  const lastName = text(body.lastName, 80);
  const whatsapp = text(body.whatsapp, 40).replace(/[^0-9+]/g, "");
  const address = text(body.address, 220);
  const description = text(body.description, 1200);
  if (!firstName || !lastName || !digits(whatsapp) || !address || !description) return Response.json({ error: "Completá nombre, apellido, WhatsApp, dirección y descripción" }, { status: 400 });
  if (body.consentContact !== true) return Response.json({ error: "Debés aceptar el registro del contacto" }, { status: 400 });
  const proPhone = digits(professional.whatsapp);
  if (!proPhone) return Response.json({ error: "El profesional todavía no tiene un WhatsApp válido cargado" }, { status: 400 });

  const id = crypto.randomUUID();
  const evaluationToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const now = new Date();
  const index = getStore({ name: "salta-request-index", consistency: "strong" });
  const code = await generateUniqueRequestCode(index);
  const record = {
    id, code, createdAt: now.toISOString(), contactOpenedAt: now.toISOString(), channel: "WhatsApp directo",
    firstName, lastName, whatsapp, clientWhatsappDigits: digits(whatsapp),
    address, description,
    serviceId: service.id, serviceName: service.name,
    professionalId: professional.id, professionalName: professional.name,
    lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
    lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
    consentContact: true, status: "Contacto iniciado",
    evaluationToken,
    clientVisit: null, clientWork: null, clientRatingSubmitted: false, clientStars: null,
    updatedAt: now.toISOString()
  };
  const store = getStore({ name: "salta-requests", consistency: "strong" });
  const evaluationIndex = getStore({ name: "salta-evaluation-index", consistency: "strong" });
  await store.setJSON(id, record);
  await index.setJSON(code, { id });
  await evaluationIndex.setJSON(evaluationToken, { id });

  const origin = new URL(req.url).origin;
  const gps = record.lat != null && record.lng != null ? `\n📍 Ubicación: https://www.google.com/maps?q=${record.lat},${record.lng}` : "";
  const addressLine = record.address ? `\n📌 Zona / dirección: ${record.address}` : "";
  const detail = record.description ? `\n📝 Necesito: ${record.description}` : "";
  const message = `Hola ${professional.name}. Te contacto mediante Salta Soluciones.\n\n🔧 Servicio: ${service.name}\n👤 Soy: ${firstName} ${lastName}${addressLine}${detail}${gps}\n\nNúmero de solicitud: ${code}\n\nCoordinamos directamente por acá. Gracias.`;
  const whatsappUrl = `https://wa.me/${proPhone}?text=${encodeURIComponent(message)}`;
  return Response.json({ ok: true, code, professionalName: professional.name, whatsappUrl, trackingUrl: `${origin}/?codigo=${encodeURIComponent(code)}#mi-solicitud` });
};

export const config = { path: "/api/contact" };
