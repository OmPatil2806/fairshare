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

export async function isGroupMember(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership !== null;
}

export function getGroupWithMembers(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

export async function addMemberToGroupByEmail(groupId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { status: "user_not_found" as const };
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });
  if (existing) {
    return { status: "already_member" as const };
  }

  const member = await prisma.groupMember.create({
    data: { groupId, userId: user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return { status: "added" as const, member };
}
