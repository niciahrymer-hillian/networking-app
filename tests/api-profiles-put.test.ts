import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { profile: { findFirst: vi.fn(), update: vi.fn() } },
}));

import { PUT } from "@/app/api/profiles/[id]/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(requireAuth);
const mockFind = vi.mocked(prisma.profile.findFirst);
const mockUpdate = vi.mocked(prisma.profile.update);

const req = (body: unknown) => ({ json: async () => body }) as never;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSession = (s: unknown) => s as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockFind.mockResolvedValue({ id: "p1" } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUpdate.mockResolvedValue({ id: "p1" } as any);
});

describe("PUT /api/profiles/[id] — template/colorScheme persistence", () => {
  it("persists a valid template + palette", async () => {
    await PUT(req({ name: "Jane", template: "bold", colorScheme: "violet" }), ctx("p1"));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ template: "bold", colorScheme: "violet" }) })
    );
  });

  it("coerces an invalid template + palette to the defaults", async () => {
    await PUT(req({ name: "Jane", template: "bogus", colorScheme: "rainbow" }), ctx("p1"));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ template: "classic", colorScheme: "emerald" }) })
    );
  });
});
