export type PermalinkState = {
  rubric: string;
  responses: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function binaryToBase64Url(binary: string) {
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBinary(encoded: string) {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  return atob(padded);
}

export function encodePermalink(rubric: string, responses: string) {
  const bytes = textEncoder.encode(JSON.stringify({ rubric, responses }));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return binaryToBase64Url(binary);
}

export function decodePermalink(hash: string): PermalinkState {
  const binary = base64UrlToBinary(hash);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const decoded = JSON.parse(textDecoder.decode(bytes));
  if (typeof decoded?.rubric !== "string" || typeof decoded?.responses !== "string") {
    throw new Error("Permalink payload must include rubric and responses strings");
  }
  return decoded;
}
