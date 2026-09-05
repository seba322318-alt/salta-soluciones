export async function generateUniqueRequestCode(indexStore) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const code = String(10000 + (random[0] % 90000));
    const existing = await indexStore.get(code, { type: "json", consistency: "strong" });
    if (!existing?.id) return code;
  }
  throw new Error("No se pudo generar un número de solicitud. Intentá nuevamente.");
}
