import { getStore } from "@netlify/blobs";
import { getState } from "./_state.mjs";

export default async () => {
  const state = await getState();
  const ratingStore = getStore({ name: "salta-ratings", consistency: "strong" });
  const { blobs } = await ratingStore.list();
  const approved = [];
  for (const item of blobs.slice(-500)) {
    const rating = await ratingStore.get(item.key, { type: "json", consistency: "strong" });
    if (rating?.approved === true && rating?.professionalId) approved.push(rating);
  }
  const summary = {};
  for (const r of approved) {
    const row = summary[r.professionalId] || { count: 0, total: 0 };
    row.count += 1;
    row.total += Number(r.stars) || 0;
    summary[r.professionalId] = row;
  }
  for (const [id, row] of Object.entries(summary)) row.average = row.count ? Math.round((row.total / row.count) * 10) / 10 : 0;

  const publicState = {
    settings: state.settings,
    services: state.services.filter((x) => x.active !== false),
    professionals: state.professionals.filter((x) => x.status === "Activo"),
    products: state.products.filter((x) => x.active !== false),
    ratingsSummary: summary
  };
  return Response.json(publicState, { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } });
};

export const config = { path: "/api/data" };
