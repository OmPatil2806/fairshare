import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateGroupBalances, simplifyDebts } from "@/lib/balances";
import { getDisplayName } from "@/lib/user";
import { getCurrencySymbol } from "@/lib/currency";
import { logActivity, ActivityActionType } from "@/lib/activity";

export class SettlementValidationError extends Error {}

// Validated against the SIMPLIFIED balance (what "Settle Up" actually shows
// the user), not the raw pairwise one. This is safe even when the simplified
// pair never had a direct expense between them: recording Settlement(P,Q,K)
// always shifts P's aggregate net position up by K and Q's down by K, no
// matter what the prior raw relationship between P and Q was — the pairwise
// netting and the aggregate summation in simplifyDebts cancel out exactly.
export async function recordSettlement(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: Prisma.Decimal,
  actorUserId: string
) {
  if (amount.lessThanOrEqualTo(0)) {
    throw new SettlementValidationError("Amount must be greater than 0");
  }

  const pairwise = await calculateGroupBalances(groupId);
  const simplified = simplifyDebts(pairwise);
  const outstanding = simplified.find(
    (b) => b.from === fromUserId && b.to === toUserId
  );

  if (!outstanding) {
    throw new SettlementValidationError(
      "There is no outstanding balance between these two people"
    );
  }

  if (amount.greaterThan(outstanding.amount)) {
    throw new SettlementValidationError(
      `Amount exceeds the outstanding balance of ${outstanding.amount.toFixed(2)}`
    );
  }

  const settlement = await prisma.settlement.create({
    data: { groupId, fromUserId, toUserId, amount },
  });

  const otherUserId = actorUserId === fromUserId ? toUserId : fromUserId;
  const [group, otherUser] = await Promise.all([
    prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      select: { currency: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: otherUserId },
      select: { name: true, email: true },
    }),
  ]);

  await logActivity(
    groupId,
    actorUserId,
    ActivityActionType.SETTLEMENT_RECORDED,
    `settled ${getCurrencySymbol(group.currency)}${amount.toFixed(2)} with ${getDisplayName(otherUser)}`
  );

  return settlement;
}

export async function getGroupSettlements(groupId: string) {
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { settledAt: "desc" },
  });

  return settlements.map((settlement) => ({
    id: settlement.id,
    groupId: settlement.groupId,
    fromUserId: settlement.fromUserId,
    toUserId: settlement.toUserId,
    amount: settlement.amount,
    settledAt: settlement.settledAt,
    fromName: getDisplayName(settlement.fromUser),
    toName: getDisplayName(settlement.toUser),
  }));
}
