import { prisma } from "@/lib/prisma";

export function getUserGroups(userId: string) {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function createGroupForUser(userId: string, name: string) {
  return prisma.group.create({
    data: {
      name,
      createdBy: userId,
      members: { create: { userId } },
    },
    include: { _count: { select: { members: true } } },
  });
}
