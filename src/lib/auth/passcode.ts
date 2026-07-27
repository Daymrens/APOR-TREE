import { createHash } from "crypto";

export function hashPasscode(passcode: string): string {
  return createHash("sha256").update(passcode).digest("hex");
}

export function verifyPasscode(
  passcode: string,
  expectedHash: string
): boolean {
  const hash = hashPasscode(passcode);
  return hash === expectedHash;
}
