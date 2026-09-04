import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";

const text = (v, max = 300) => String(v || "").trim().slice(0, max);

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
  if (!firstName || !lastName || !whatsapp || !address) return Response.json({ error: "Completá nombre, apellido, WhatsApp y dirección" }, { status: 400 });
  const id = crypto.randomUUID();
  const now = new Date();
  const code = `SS-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${id.slice(0, 5).toUpperCase()}`;
  const record = {
    id,
    code,
    createdAt: now.toISOString(),
    firstName,
    lastName,
    whatsapp,
    address,
    description: text(body.description, 1200),
    serviceId: service.id,
    serviceName: service.name,
    lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : null,
    lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : null,
    consentContact: body.consentContact === true,
    status: "Nueva",
    professionalId: null
  };
  if (!record.consentContact) return Response.json({ error: "Debés confirmar que aceptás recibir contacto" }, { status: 400 });
  const store = getStore({ name: "salta-requests", consistency: "strong" });
  await store.setJSON(id, record);
  return Response.json({ ok: true, code });
};

export const config = { path: "/api/request" };
