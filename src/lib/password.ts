import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (storedHash.startsWith("scrypt$")) {
      const [, saltHex, keyHex] = storedHash.split("$");
      if (!saltHex || !keyHex) return false;
      const expected = Buffer.from(keyHex, "hex");
      const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    }

    // Compatibility only; successful authentication upgrades legacy SHA-256 hashes.
    const legacy = Buffer.from(createHash("sha256").update(password).digest("hex"), "utf8");
    const expected = Buffer.from(storedHash, "utf8");
    return legacy.length === expected.length && timingSafeEqual(legacy, expected);
  } catch {
    return false;
  }
}