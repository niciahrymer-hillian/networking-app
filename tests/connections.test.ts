import { describe, it, expect } from "vitest";
import { isOwnerDecision } from "@/lib/connections";

// Unit tests for the status guard that the PATCH route relies on.
// An owner may only move a request to "confirmed" or "declined" — nothing else.
describe("isOwnerDecision", () => {
  it("accepts the two owner decisions", () => {
    expect(isOwnerDecision("confirmed")).toBe(true);
    expect(isOwnerDecision("declined")).toBe(true);
  });

  it('rejects "pending" — you cannot reset a request back to the inbox', () => {
    expect(isOwnerDecision("pending")).toBe(false);
  });

  it("rejects unknown strings and non-strings", () => {
    expect(isOwnerDecision("approved")).toBe(false);
    expect(isOwnerDecision("")).toBe(false);
    expect(isOwnerDecision(undefined)).toBe(false);
    expect(isOwnerDecision(null)).toBe(false);
    expect(isOwnerDecision(1)).toBe(false);
    expect(isOwnerDecision({ status: "confirmed" })).toBe(false);
  });
});
