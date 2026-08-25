import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EXPENSE_INCLUDE = {
  payer: { select: { id: true, name: true, email: true } },
  splits: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.ExpenseInclude;

export function getGroupExpenses(groupId: string) {
  return prisma.expense.findMany({
    where: { groupId },
    include: EXPENSE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

// Splits `amount` evenly across `memberIds` in integer cents, then gives any
// leftover cent(s) from the division to the last member so the splits always
// sum exactly to `amount` — never relying on floating-point arithmetic.
function calculateEqualSplits(amount: Prisma.Decimal, memberIds: string[]) {
  const totalCents = amount
    .times(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const baseCents = totalCents.dividedBy(memberIds.length).floor();
  const remainderCents = totalCents.minus(baseCents.times(memberIds.length));

  return memberIds.map((userId, index) => {
    const isLast = index === memberIds.length - 1;
    const cents = isLast ? baseCents.plus(remainderCents) : baseCents;
    return { userId, amountOwed: cents.dividedBy(100) };
  });
}

export async function createGroupExpense(
  groupId: string,
  title: string,
  amount: Prisma.Decimal,
  paidBy: string
) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  const splits = calculateEqualSplits(amount, memberIds);

  return prisma.expense.create({
    data: {
      groupId,
      paidBy,
      title,
      amount,
      splitType: "EQUAL",
      splits: { create: splits },
    },
    include: EXPENSE_INCLUDE,
  });
}
