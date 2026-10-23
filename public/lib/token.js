// The results link token. It holds the 15 answers and the niche description,
// nothing else. No name and no email address ever go in it.
//
// Format: "1" (version) + 15 digits (one per answer, 0 to 3) + the niche
// description as URL-safe base64.
import { QUESTIONS, NICHE_MAX_CHARS } from "./config.js";

const VERSION = "1";

export function capNiche(text) {
  return Array.from(String(text || "").replace(/\s+/g, " ").trim()).slice(0, NICHE_MAX_CHARS).join("");
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64) {
  if (!/^[A-Za-z0-9_-]*$/.test(b64)) throw new Error("Bad token");
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function encodeToken(answers, niche) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) throw new Error("Bad answers");
  const digits = answers.map((a) => {
    if (!Number.isInteger(a) || a < 0 || a > 3) throw new Error("Bad answer");
    return String(a);
  }).join("");
  return VERSION + digits + toBase64Url(capNiche(niche));
}

// Returns { answers, niche } or throws if the token is not valid.
export function decodeToken(token) {
  const t = String(token || "");
  const n = QUESTIONS.length;
  if (t.length > 2000 || t[0] !== VERSION) throw new Error("Bad token");
  const digits = t.slice(1, 1 + n);
  if (!new RegExp(`^[0-3]{${n}}$`).test(digits)) throw new Error("Bad token");
  const niche = capNiche(fromBase64Url(t.slice(1 + n)));
  if (!niche) throw new Error("Bad token");
  return { answers: Array.from(digits, Number), niche };
}
