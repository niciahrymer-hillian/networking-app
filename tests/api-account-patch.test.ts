import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth + db so the route runs with no real session or database.
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { update: vi.fn() },
    profile: { updateMany: vi.fn() },
  },
}));

import { PATCH } from "@/app/api/account/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockRequireAuth = vi.mocked(requireAuth);
const mockUserUpdate = vi.mocked(prisma.user.update);
const mockProfileUpdateMany = vi.mocked(prisma.profile.updateMany);

const makeReq = (body: unknown) => ({ json: async () => body }) as never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSession = (s: unknown) => s as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockUserUpdate.mockResolvedValue({} as never);
  mockProfileUpdateMany.mockResolvedValue({ count: 1 } as never);
});

describe("PATCH /api/account — name propagation rule", () => {
  it("returns 401 when not logged in and writes nothing", async () => {
    mockRequireAuth.mockResolvedValue(null);

    const res = await PATCH(makeReq({ name: "New Name" }));

    expect(res.status).toBe(401);
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockProfileUpdateMany).not.toHaveBeenCalled();
  });

  it("propagates a new full name onto every card the user owns", async () => {
    mockRequireAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));

    await PATCH(makeReq({ name: "  Niciah Rymer-Hillian  " }));

    // Account name updated (trimmed)...
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" }, data: expect.objectContaining({ name: "Niciah Rymer-Hillian" }) })
    );
    // ...and the same name pushed to all owned cards (→ business card + QR).
    expect(mockProfileUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { name: "Niciah Rymer-Hillian" },
    });
  });

  it("does NOT blank out cards when the account name is cleared", async () => {
    mockRequireAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));

    await PATCH(makeReq({ name: "" }));

    expect(mockUserUpdate).toHaveBeenCalled();
    expect(mockProfileUpdateMany).not.toHaveBeenCalled();
  });

  it("does not touch cards when only the avatar changes", async () => {
    mockRequireAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));

    await PATCH(makeReq({ avatarUrl: "https://example.com/a.png" }));

    expect(mockProfileUpdateMany).not.toHaveBeenCalled();
  });
});
