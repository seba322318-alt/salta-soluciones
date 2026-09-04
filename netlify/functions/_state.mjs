import { getStore } from "@netlify/blobs";
import { defaultState } from "./_defaults.mjs";

export async function getState() {
  const store = getStore({ name: "salta-config", consistency: "strong" });
  const saved = await store.get("state", { type: "json", consistency: "strong" });
  if (!saved) return structuredClone(defaultState);
  return {
    settings: { ...defaultState.settings, ...(saved.settings || {}) },
    services: Array.isArray(saved.services) ? saved.services : structuredClone(defaultState.services),
    professionals: Array.isArray(saved.professionals) ? saved.professionals : [],
    products: Array.isArray(saved.products) ? saved.products : []
  };
}

export async function saveState(state) {
  const store = getStore({ name: "salta-config", consistency: "strong" });
  await store.setJSON("state", state);
}
