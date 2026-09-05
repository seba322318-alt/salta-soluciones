import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_auth.mjs";
import { getState, saveState } from "./_state.mjs";


const CLEANUP_MARKER_KEY = "requested-test-data-cleanup-v5-2026-09-05";

async function clearRequestedTestDataOnce() {
  const maintenance = getStore({ name: "salta-maintenance", consistency: "strong" });
  const marker = await maintenance.get(CLEANUP_MARKER_KEY, { type: "json", consistency: "strong" });
  if (marker?.done === true) return false;

  // Limpieza solicitada antes de publicar oficialmente: conserva configuración,
  // profesionales, servicios, productos e imágenes; elimina solo pruebas operativas.
  for (const name of ["salta-requests", "salta-request-index", "salta-evaluation-index", "salta-ratings"]) {
    const store = getStore({ name, consistency: "strong" });
    await store.deleteAll();
  }
  await maintenance.setJSON(CLEANUP_MARKER_KEY, { done: true, cleanedAt: new Date().toISOString() });
  return true;
}

async function readAll(storeName, limit = 500) {
  const store = getStore({ name: storeName, consistency: "strong" });
  const { blobs } = await store.list();
  const rows = [];
  for (const item of blobs.slice(-limit)) {
    const value = await store.get(item.key, { type: "json", consistency: "strong" });
    if (value) rows.push(value);
  }
  rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return rows;
}

export default async (req) => {
  if (!(await requireAdmin(req))) return Response.json({ error: "No autorizado" }, { status: 401 });
  const initialCleanupPerformed = await clearRequestedTestDataOnce();
  const [state, requests, ratings] = await Promise.all([getState(), readAll("salta-requests"), readAll("salta-ratings")]);
  let changed = false;
  for (const p of state.professionals || []) {
    if (!p.portalToken) { p.portalToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""); changed = true; }
  }
  if (changed) await saveState(state);
  return Response.json({ state, requests, ratings, initialCleanupPerformed }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/admin/data" };
