import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_auth.mjs";
import { getState, saveState } from "./_state.mjs";

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
  const [state, requests, ratings] = await Promise.all([getState(), readAll("salta-requests"), readAll("salta-ratings")]);
  let changed = false;
  for (const p of state.professionals || []) {
    if (!p.portalToken) { p.portalToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""); changed = true; }
  }
  if (changed) await saveState(state);
  return Response.json({ state, requests, ratings }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/admin/data" };
