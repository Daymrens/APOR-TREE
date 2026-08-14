import { createHash, timingSafeEqual } from "crypto";

export function hashPasscode(passcode: string): string {
  return createHash("sha256").update(passcode).digest("hex");
}

export function verifyPasscode(
  passcode: string,
  expectedHash: string
): boolean {
  const hash = hashPasscode(passcode);
  const hashBuf = Buffer.from(hash, "utf-8");
  const expectedBuf = Buffer.from(expectedHash, "utf-8");
  if (hashBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(hashBuf, expectedBuf);
}

const SESSION_SECRET = () =>
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSCODE_HASH ||
  "apor-fallback-secret-change-me";

async function hmacHex(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function signSessionToken(): Promise<string> {
  const secret = SESSION_SECRET();
  const value = await hmacHex("", secret);
  const token = await hmacHex(value, secret);
  return `${value}.${token}`;
}

export async function verifySessionToken(
  cookie: string | undefined
): Promise<boolean> {
  if (!cookie) return false;
  const [value, token] = cookie.split(".");
  if (!value || !token) return false;
  const expected = await hmacHex(value, SESSION_SECRET());
  return safeEqualHex(token, expected);
}
