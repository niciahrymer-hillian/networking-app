// Connection status model for confirm-to-connect (Phase 2).
// WHY: A scanned submission starts as `pending`; only the profile owner can move
//      it to `confirmed` (joins their network) or `declined` (hidden, retained).
//      Centralising the valid values + the owner-decision guard keeps the PATCH
//      route thin and gives the test suite a pure function to assert against.

export type ConnectionStatus = "pending" | "confirmed" | "declined";

// The only transitions an owner is allowed to request via the API.
// EFFECT: Guards PATCH /api/connections/[id] — "pending" (the initial state) and
//         any arbitrary value are rejected, so the endpoint can't be used to
//         reset a connection back to a request or write a bogus status.
export function isOwnerDecision(value: unknown): value is "confirmed" | "declined" {
  return value === "confirmed" || value === "declined";
}
