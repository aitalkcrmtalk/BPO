import { createHmac } from "crypto";

/** Assina o payload com HMAC-SHA256 e faz POST fire-and-forget. Retorna o status HTTP. */
export async function dispatchWebhook(
  url: string,
  secret: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-signature-alg": "sha256",
      },
      body,
    });
    if (!res.ok) console.warn(`[webhook] ${url} respondeu ${res.status}`);
    return res.status;
  } catch (err) {
    console.error(`[webhook] erro ao chamar ${url}:`, err);
    return 0;
  }
}

/** Verifica HMAC de um body cru recebido (compara tempo-constante). */
export function verifyHmac(rawBody: string, secret: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}