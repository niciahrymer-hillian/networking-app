import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth + db layers so the route runs with no real session or database.
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { connection: { updateMany: vi.fn() } },
}));

import { PATCH } from "@/app/api/connections/[id]/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockRequireAuth = vi.mocked(requireAuth);
const mockUpdateMany = vi.mocked(prisma.connection.updateMany);

// Minimal stand-ins for the Route Handler's (req, ctx) arguments.
const makeReq = (body: unknown) => ({ json: async () => body }) as never;
const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSession = (s: unknown) => s as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/connections/[id]", () => {
  it("returns 401 when the caller is not logged in", async () => {
    mockRequireAuth.mockResolvedValue(null);

    const res = await PATCH(makeReq({ status: "confirmed" }), makeCtx("c1"));

    expect(res.status).toBe(401);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-decision status (e.g. resetting to pending)", async () => {
    mockRequireAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));

    const res = await PATCH(makeReq({ status: "pending" }), makeCtx("c1"));

    expect(res.status).toBe(400);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("scopes the update to connections the user owns (relation filter)", async () => {
    mockRequireAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
    mockUpdateMany.mockResolvedValue({ count: 1 });

    const res = await PATCH(makeReq({ status: "confirmed" }), makeCtx("c1"));

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "c1", profile: { userId: "u1" } },
      data: { status: "confirmed" },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, status: "confirmed" });
  });

  it("returns 404 when no owned row matches (someone else's connection)", async () => {
    mockRequireAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const res = await PATCH(makeReq({ status: "declined" }), makeCtx("not-mine"));

    expect(res.status).toBe(404);
  });
});
