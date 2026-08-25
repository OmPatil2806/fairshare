import { prisma } from "@/lib/prisma";
import { getDisplayName } from "@/lib/user";

export const ActivityActionType = {
  GROUP_CREATED: "GROUP_CREATED",
  MEMBER_ADDED: "MEMBER_ADDED",
  EXPENSE_ADDED: "EXPENSE_ADDED",
  SETTLEMENT_RECORDED: "SETTLEMENT_RECORDED",
  REMINDER_SENT: "REMINDER_SENT",
} as const;

export function logActivity(
  groupId: string,
  userId: string,
  actionType: string,
  description: string
) {
  return prisma.activity.create({
    data: { groupId, userId, actionType, description },
  });
}

export async function getGroupActivity(groupId: string) {
  const activities = await prisma.activity.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return activities.map((activity) => ({
    id: activity.id,
    groupId: activity.groupId,
    userId: activity.userId,
    actionType: activity.actionType,
    description: activity.description,
    createdAt: activity.createdAt,
    actorName: getDisplayName(activity.user),
  }));
}
