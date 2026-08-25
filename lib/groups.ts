import { prisma } from "@/lib/prisma";
import type { Currency } from "@prisma/client";

export function getUserGroups(userId: string) {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function createGroupForUser(
  userId: string,
  name: string,
  currency?: Currency
) {
  return prisma.group.create({
    data: {
      name,
      createdBy: userId,
      currency,
      members: { create: { userId } },
    },
    include: { _count: { select: { members: true } } },
  });
}
