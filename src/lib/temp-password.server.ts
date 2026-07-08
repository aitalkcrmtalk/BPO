import { randomBytes } from "node:crypto";

/** Gera senha temporária alfanumérica de 12 caracteres (server-only). */
export function generateTempPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Gera protocolo curto para exibir ao solicitante. */
export function generateProtocol(): string {
  const y = new Date().getFullYear();
  const s = randomBytes(4).toString("hex").toUpperCase();
  return `BPO-${y}-${s}`;
}