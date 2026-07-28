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
