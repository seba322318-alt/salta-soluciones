import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_auth.mjs";
import { getState, saveState } from "./_state.mjs";
import { cleanPhone, slugify } from "./_defaults.mjs";

const str = (v, max = 500) => String(v || "").trim().slice(0, max);
const bool = (v) => v === true;

function sanitizeState(input) {
  const settings = input?.settings || {};
  const services = Array.isArray(input?.services) ? input.services : [];
  const professionals = Array.isArray(input?.professionals) ? input.professionals : [];
  const products = Array.isArray(input?.products) ? input.products : [];
  return {
    settings: {
      brandName: str(settings.brandName, 80) || "Salta Soluciones",
      tagline: str(settings.tagline, 120) || "CONECTA · RESUELVE · CONFIANZA",
      heroTitle: str(settings.heroTitle, 160) || "Encontrá el servicio que necesitás en Salta",
      heroHighlight: str(settings.heroHighlight, 60) || "Salta",
      heroSubtitle: str(settings.heroSubtitle, 350) || "Electricistas, plomeros, técnicos, herreros y muchos servicios más en Salta Capital.",
      searchPlaceholder: str(settings.searchPlaceholder, 120) || "¿Qué servicio necesitás hoy?",
      welcomeTitle: str(settings.welcomeTitle, 120) || "Bienvenido a Salta Soluciones",
      welcomeText: str(settings.welcomeText, 600) || "Encontrá profesionales y servicios de confianza en un solo lugar. Elegí al profesional que mejor se adapte a vos y contactalo directamente. Si necesitás orientación, también podés hablar con Salta Soluciones.",
      servicesTitle: str(settings.servicesTitle, 80) || "Servicios disponibles",
      servicesSubtitle: str(settings.servicesSubtitle, 220) || "Elegí el servicio que necesitás para ver profesionales disponibles.",
      heroStart: /^#[0-9a-fA-F]{6}$/.test(settings.heroStart) ? settings.heroStart : "#061f43",
      heroEnd: /^#[0-9a-fA-F]{6}$/.test(settings.heroEnd) ? settings.heroEnd : "#0a4b8f",
      titleColor: /^#[0-9a-fA-F]{6}$/.test(settings.titleColor) ? settings.titleColor : "#ffffff",
      highlightColor: /^#[0-9a-fA-F]{6}$/.test(settings.highlightColor) ? settings.highlightColor : "#35d1ff",
      glow: Math.max(0, Math.min(100, Number(settings.glow) || 0)),
      whatsapp: cleanPhone(settings.whatsapp) || "543872521955",
      logoUrl: str(settings.logoUrl, 400) || "/assets/logo.png",
      showProfessionals: settings.showProfessionals !== false,
      showProducts: settings.showProducts !== false,
      showRatings: settings.showRatings !== false
    },
    services: services.slice(0, 200).map((s) => ({
      id: str(s.id, 100) || crypto.randomUUID(),
      name: str(s.name, 80), slug: slugify(str(s.slug || s.name, 100)),
      description: str(s.description, 220), icon: str(s.icon, 20), imageUrl: str(s.imageUrl, 400),
      whatsapp: cleanPhone(s.whatsapp), active: s.active !== false
    })).filter((s) => s.name),
    professionals: professionals.slice(0, 500).map((p) => ({
      id: str(p.id, 100) || crypto.randomUUID(), photoUrl: str(p.photoUrl, 400), name: str(p.name, 120),
      serviceIds: Array.isArray(p.serviceIds) ? p.serviceIds.map((x) => str(x, 100)).slice(0, 20) : [],
      yearsExperience: Math.max(0, Math.min(70, Number(p.yearsExperience) || 0)), whatsapp: cleanPhone(p.whatsapp),
      zone: str(p.zone, 160), availability: str(p.availability, 80), privateNotes: str(p.privateNotes, 1500),
      monthlyFee: str(p.monthlyFee, 60), nextPayment: str(p.nextPayment, 20),
      portalToken: str(p.portalToken, 160) || (crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "")),
      paymentStatus: ["Al día", "Pendiente", "Vencido"].includes(p.paymentStatus) ? p.paymentStatus : "Al día",
      status: ["Activo", "Inactivo", "Suspendido"].includes(p.status) ? p.status : "Activo"
    })).filter((p) => p.name),
    products: products.slice(0, 500).map((p) => ({
      id: str(p.id, 100) || crypto.randomUUID(), name: str(p.name, 140), description: str(p.description, 1500),
      price: str(p.price, 60), whatsapp: cleanPhone(p.whatsapp), active: p.active !== false,
      images: Array.isArray(p.images) ? p.images.map((x) => str(x, 400)).filter(Boolean).slice(0, 5) : []
    })).filter((p) => p.name)
  };
}

export default async (req) => {
  if (!(await requireAdmin(req))) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Datos inválidos" }, { status: 400 });

  if (body.action === "saveState") {
    const clean = sanitizeState(body.state); await saveState(clean); return Response.json({ ok: true, state: clean });
  }

  if (body.action === "regenerateProfessionalToken") {
    const state = await getState();
    const id = str(body.id, 120);
    const professional = (state.professionals || []).find((p) => p.id === id);
    if (!professional) return Response.json({ error: "Profesional no encontrado" }, { status: 404 });
    professional.portalToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    await saveState(state);
    return Response.json({ ok: true, portalToken: professional.portalToken });
  }

  if (body.action === "ensureEvaluationToken" || body.action === "regenerateEvaluationToken") {
    const id = str(body.id, 120);
    const store = getStore({ name: "salta-requests", consistency: "strong" });
    const row = await store.get(id, { type: "json", consistency: "strong" });
    if (!row) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });
    if (!row.evaluationToken || body.action === "regenerateEvaluationToken") {
      row.evaluationToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
      row.updatedAt = new Date().toISOString();
      await store.setJSON(row.id, row);
    }
    const evaluationIndex = getStore({ name: "salta-evaluation-index", consistency: "strong" });
    await evaluationIndex.setJSON(row.evaluationToken, { id: row.id });
    return Response.json({ ok: true, evaluationToken: row.evaluationToken });
  }

  if (body.action === "assignProfessional") {
    const id = str(body.id, 120);
    const professionalId = str(body.professionalId, 120);
    const state = await getState();
    const store = getStore({ name: "salta-requests", consistency: "strong" });
    const row = await store.get(id, { type: "json", consistency: "strong" });
    if (!row) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });
    const professional = (state.professionals || []).find((p) => p.id === professionalId && p.status === "Activo");
    if (!professional) return Response.json({ error: "Profesional no disponible" }, { status: 400 });
    if (!(professional.serviceIds || []).includes(row.serviceId)) return Response.json({ error: "Ese profesional no ofrece el servicio solicitado" }, { status: 400 });
    const now = new Date().toISOString();
    row.professionalId = professional.id;
    row.professionalName = professional.name;
    row.professionalResponse = "Pendiente";
    row.professionalWork = false;
    row.assignedAt = now;
    row.status = "Profesional asignado";
    row.updatedAt = now;
    await store.setJSON(row.id, row);
    return Response.json({ ok: true, request: row });
  }


  if (body.action === "deleteRequest") {
    const id = str(body.id, 120);
    const requestStore = getStore({ name: "salta-requests", consistency: "strong" });
    const requestIndex = getStore({ name: "salta-request-index", consistency: "strong" });
    const evaluationIndex = getStore({ name: "salta-evaluation-index", consistency: "strong" });
    const ratingStore = getStore({ name: "salta-ratings", consistency: "strong" });
    const row = await requestStore.get(id, { type: "json", consistency: "strong" });
    if (!row) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });

    if (row.code) await requestIndex.delete(String(row.code));
    if (row.evaluationToken) await evaluationIndex.delete(String(row.evaluationToken));

    // Las calificaciones verificadas actuales usan request-<id>. También se revisan
    // registros anteriores para no dejar una opinión huérfana al borrar la solicitud.
    await ratingStore.delete(`request-${id}`);
    const listedRatings = await ratingStore.list();
    for (const item of listedRatings.blobs || []) {
      if (item.key === `request-${id}`) continue;
      const rating = await ratingStore.get(item.key, { type: "json", consistency: "strong" });
      if (rating?.requestId === id) await ratingStore.delete(item.key);
    }

    await requestStore.delete(id);
    return Response.json({ ok: true, deletedId: id, deletedCode: row.code || "" });
  }

  if (body.action === "ratingModerate") {
    const store = getStore({ name: "salta-ratings", consistency: "strong" });
    const row = await store.get(str(body.id, 100), { type: "json", consistency: "strong" });
    if (!row) return Response.json({ error: "Calificación no encontrada" }, { status: 404 });
    row.approved = bool(body.approved); row.moderatedAt = new Date().toISOString(); await store.setJSON(row.id, row);
    return Response.json({ ok: true, rating: row });
  }

  return Response.json({ error: "Acción no reconocida" }, { status: 400 });
};

export const config = { path: "/api/admin/save" };
