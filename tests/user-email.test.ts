import { describe, it, expect, beforeAll } from "vitest";

// A fixed 64-hex test key so encrypt/decrypt round-trips deterministically.
beforeAll(() => {
  process.env.ENCRYPTION_KEY = "0".repeat(64);
});

import { emailWriteFields, emailMatchClauses, readEmail, normalizeEmail } from "@/lib/user-email";
import { decrypt, hash } from "@/lib/crypto";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("emailWriteFields", () => {
  it("stores no plaintext, an encrypted blob, and a deterministic hash", () => {
    const f = emailWriteFields("  User@Example.com ");
    expect(f.email).toBeNull(); // plaintext never stored
    expect(f.emailHash).toBe(hash("user@example.com")); // normalized hash
    expect(decrypt(f.emailEnc)).toBe("user@example.com"); // recoverable with the key
  });

  it("produces a different ciphertext each call (random IV) but the same hash", () => {
    const a = emailWriteFields("a@b.com");
    const b = emailWriteFields("a@b.com");
    expect(a.emailEnc).not.toBe(b.emailEnc); // IV randomized
    expect(a.emailHash).toBe(b.emailHash); // lookup key stable
  });
});

describe("emailMatchClauses", () => {
  it("matches both the encrypted-row hash and any legacy plaintext", () => {
    const clauses = emailMatchClauses("  User@Example.com ");
    expect(clauses).toEqual([
      { emailHash: hash("user@example.com") },
      { email: "user@example.com" },
    ]);
  });
});

describe("readEmail", () => {
  it("decrypts emailEnc when present", () => {
    const { emailEnc } = emailWriteFields("jane@doe.com");
    expect(readEmail({ emailEnc, email: null })).toBe("jane@doe.com");
  });

  it("falls back to legacy plaintext when not yet migrated", () => {
    expect(readEmail({ emailEnc: null, email: "legacy@old.com" })).toBe("legacy@old.com");
  });

  it("returns null (fails closed) on undecryptable data", () => {
    expect(readEmail({ emailEnc: "not-valid-base64-ciphertext", email: null })).toBeNull();
  });

  it("returns null when there is no email at all", () => {
    expect(readEmail({ emailEnc: null, email: null })).toBeNull();
  });
});
