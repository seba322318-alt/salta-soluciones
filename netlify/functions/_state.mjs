import { getStore } from "@netlify/blobs";
import { defaultState } from "./_defaults.mjs";

const principalTextKeys = [
  "brandName", "tagline", "heroTitle", "heroHighlight", "heroSubtitle",
  "searchPlaceholder", "welcomeTitle", "welcomeText",
  "servicesTitle", "servicesSubtitle", "whatsapp", "logoUrl"
];

function normalizeSettings(savedSettings = {}) {
  const merged = { ...defaultState.settings, ...(savedSettings || {}) };

  // Repara únicamente campos principales que hayan quedado vacíos por una versión anterior.
  // No modifica valores personalizados que tengan contenido.
  for (const key of principalTextKeys) {
    if (typeof merged[key] !== "string" || !merged[key].trim()) {
      merged[key] = defaultState.settings[key];
    }
  }
  return merged;
}

export async function getState() {
  const store = getStore({ name: "salta-config", consistency: "strong" });
  const saved = await store.get("state", { type: "json", consistency: "strong" });

  if (!saved) return structuredClone(defaultState);

  return {
    settings: normalizeSettings(saved.settings),
    services: Array.isArray(saved.services) ? saved.services : structuredClone(defaultState.services),
    professionals: Array.isArray(saved.professionals) ? saved.professionals : [],
    products: Array.isArray(saved.products) ? saved.products : []
  };
}

export async function saveState(state) {
  const store = getStore({ name: "salta-config", consistency: "strong" });
  await store.setJSON("state", state);
}
