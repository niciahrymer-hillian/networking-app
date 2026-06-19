import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db layer so the helper runs with no real database.
vi.mock("@/lib/db", () => ({
  prisma: { user: { findMany: vi.fn() } },
}));

import { usersCreatedToday, startOfToday } from "@/lib/users";
import { prisma } from "@/lib/db";

const mockFindMany = vi.mocked(prisma.user.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startOfToday", () => {
  it("zeroes the time portion of the given moment", () => {
    const start = startOfToday(new Date("2026-06-19T15:49:22.000"));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
    expect(start.getDate()).toBe(new Date("2026-06-19T15:49:22.000").getDate());
  });
});

describe("usersCreatedToday", () => {
  it("queries for accounts created since midnight today, newest first", async () => {
    const now = new Date("2026-06-19T15:49:22.000");
    mockFindMany.mockResolvedValue([] as never);

    await usersCreatedToday(now);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const arg = mockFindMany.mock.calls[0][0] as {
      where: { createdAt: { gte: Date } };
      orderBy: { createdAt: string };
      select: Record<string, boolean>;
    };
    expect(arg.where.createdAt.gte).toEqual(startOfToday(now));
    expect(arg.orderBy).toEqual({ createdAt: "desc" });
    // Returns identifying info, never the password hash.
    expect(arg.select).toMatchObject({ id: true, username: true, name: true, email: true, createdAt: true });
    expect(arg.select).not.toHaveProperty("passwordHash");
  });

  it("returns the rows the database provides", async () => {
    const rows = [
      { id: "u1", username: "nicoler", name: null, email: "nr201131@gmail.com", createdAt: new Date() },
    ];
    mockFindMany.mockResolvedValue(rows as never);

    const result = await usersCreatedToday();

    expect(result).toEqual(rows);
  });

  it("returns an empty list when no one signed up today", async () => {
    mockFindMany.mockResolvedValue([] as never);

    const result = await usersCreatedToday();

    expect(result).toEqual([]);
  });
});
