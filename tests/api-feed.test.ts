import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    userConnection: { upsert: vi.fn() },
    user: { findUnique: vi.fn() },
    post: { create: vi.fn() },
  },
}));

import { POST as networkConnect } from "@/app/api/network/connect/route";
import { POST as createPost } from "@/app/api/posts/route";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(requireAuth);
const mockUpsert = vi.mocked(prisma.userConnection.upsert);
const mockFindUser = vi.mocked(prisma.user.findUnique);
const mockCreatePost = vi.mocked(prisma.post.create);

const req = (body: unknown) => ({ json: async () => body }) as never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSession = (s: unknown) => s as any;

beforeEach(() => vi.clearAllMocks());

describe("POST /api/network/connect", () => {
  it("401 when not logged in", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await networkConnect(req({ ownerUserId: "u2" }));
    expect(res.status).toBe(401);
  });

  it("400 when connecting with yourself", async () => {
    mockAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
    const res = await networkConnect(req({ ownerUserId: "u1" }));
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("creates the mutual link (both directions) on a valid connect", async () => {
    mockAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUser.mockResolvedValue({ id: "u2" } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpsert.mockResolvedValue({} as any);
    const res = await networkConnect(req({ ownerUserId: "u2" }));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(2); // u1->u2 and u2->u1
  });
});

describe("POST /api/posts", () => {
  it("401 when not logged in", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await createPost(req({ content: "hi" }));
    expect(res.status).toBe(401);
  });

  it("400 on empty content", async () => {
    mockAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
    const res = await createPost(req({ content: "   " }));
    expect(res.status).toBe(400);
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("201 and creates the post on valid content", async () => {
    mockAuth.mockResolvedValue(asSession({ userId: "u1", isLoggedIn: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreatePost.mockResolvedValue({ id: "p1" } as any);
    const res = await createPost(req({ content: "  hello network  " }));
    expect(res.status).toBe(201);
    expect(mockCreatePost).toHaveBeenCalledWith(
      expect.objectContaining({ data: { authorId: "u1", content: "hello network" } })
    );
  });
});
