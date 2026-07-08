/** Dispara webhook n8n de forma fire-and-forget (não bloqueia UX se n8n cair). */
export async function fireN8nWebhook(path: string, payload: Record<string, unknown>): Promise<void> {
  const base = process.env.N8N_WEBHOOK_URL;
  if (!base) {
    console.warn(`[n8n] N8N_WEBHOOK_URL ausente — pulando webhook ${path}`);
    return;
  }
  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.N8N_API_KEY) headers["X-N8N-API-KEY"] = process.env.N8N_API_KEY;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    if (!res.ok) console.warn(`[n8n] webhook ${path} respondeu ${res.status}`);
  } catch (err) {
    console.error(`[n8n] erro chamando ${path}:`, err);
  }
}