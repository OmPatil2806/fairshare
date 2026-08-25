import { Prisma, SplitType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EXPENSE_INCLUDE = {
  payer: { select: { id: true, name: true, email: true } },
  splits: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.ExpenseInclude;

export class SplitValidationError extends Error {}

export function getGroupExpenses(groupId: string) {
  return prisma.expense.findMany({
    where: { groupId },
    include: EXPENSE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

type Split = { userId: string; amountOwed: Prisma.Decimal };

const SUM_TOLERANCE = new Prisma.Decimal("0.01");

// Splits `amount` evenly across `memberIds` in integer cents, then gives any
// leftover cent(s) from the division to the last member so the splits always
// sum exactly to `amount` — never relying on floating-point arithmetic.
function calculateEqualSplits(
  amount: Prisma.Decimal,
  memberIds: string[]
): Split[] {
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

// Takes the exact amount entered for each member and validates they sum to
// the expense total (within a 1-cent tolerance for manual-entry rounding).
// Stores the amounts as entered — the whole point of a custom split is that
// the user picked them deliberately.
export function calculateCustomSplits(
  memberIds: string[],
  customAmounts: Record<string, string | number>,
  totalAmount: Prisma.Decimal
): Split[] {
  const splits = memberIds.map((userId) => {
    const raw = customAmounts[userId] ?? "0";
    let amount: Prisma.Decimal;
    try {
      amount = new Prisma.Decimal(String(raw)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );
    } catch {
      throw new SplitValidationError("Invalid custom amount for a member");
    }
    if (amount.isNegative()) {
      throw new SplitValidationError("Custom amounts cannot be negative");
    }
    return { userId, amountOwed: amount };
  });

  const sum = splits.reduce(
    (acc, s) => acc.plus(s.amountOwed),
    new Prisma.Decimal(0)
  );

  if (sum.minus(totalAmount).abs().greaterThan(SUM_TOLERANCE)) {
    throw new SplitValidationError(
      `Custom amounts must sum to the expense total (got ${sum.toFixed(2)}, expected ${totalAmount.toFixed(2)})`
    );
  }

  return splits;
}

// Takes a percentage per member, validates they sum to 100 (within a 0.01
// tolerance), then converts each to a cents-based Decimal amount using the
// same leftover-to-last-member rounding as calculateEqualSplits, so the
// resulting amounts always sum exactly to `totalAmount`.
export function calculatePercentageSplits(
  memberIds: string[],
  percentages: Record<string, string | number>,
  totalAmount: Prisma.Decimal
): Split[] {
  const parsed = memberIds.map((userId) => {
    const raw = percentages[userId] ?? "0";
    let percentage: Prisma.Decimal;
    try {
      percentage = new Prisma.Decimal(String(raw));
    } catch {
      throw new SplitValidationError("Invalid percentage for a member");
    }
    if (percentage.isNegative()) {
      throw new SplitValidationError("Percentages cannot be negative");
    }
    return { userId, percentage };
  });

  const sum = parsed.reduce(
    (acc, p) => acc.plus(p.percentage),
    new Prisma.Decimal(0)
  );

  if (sum.minus(100).abs().greaterThan(SUM_TOLERANCE)) {
    throw new SplitValidationError(
      `Percentages must sum to 100 (got ${sum.toFixed(2)})`
    );
  }

  const totalCents = totalAmount
    .times(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  let allocatedCents = new Prisma.Decimal(0);

  return parsed.map(({ userId, percentage }, index) => {
    const isLast = index === parsed.length - 1;
    if (isLast) {
      return { userId, amountOwed: totalCents.minus(allocatedCents).dividedBy(100) };
    }
    const cents = totalCents
      .times(percentage)
      .dividedBy(100)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
    allocatedCents = allocatedCents.plus(cents);
    return { userId, amountOwed: cents.dividedBy(100) };
  });
}

export type CreateExpenseInput =
  | { splitType: "EQUAL" }
  | { splitType: "CUSTOM"; customAmounts: Record<string, string | number> }
  | { splitType: "PERCENTAGE"; percentages: Record<string, string | number> };

export async function createGroupExpense(
  groupId: string,
  title: string,
  amount: Prisma.Decimal,
  paidBy: string,
  splitInput: CreateExpenseInput
) {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  let splits: Split[];
  switch (splitInput.splitType) {
    case "EQUAL":
      splits = calculateEqualSplits(amount, memberIds);
      break;
    case "CUSTOM":
      splits = calculateCustomSplits(memberIds, splitInput.customAmounts, amount);
      break;
    case "PERCENTAGE":
      splits = calculatePercentageSplits(memberIds, splitInput.percentages, amount);
      break;
  }

  return prisma.expense.create({
    data: {
      groupId,
      paidBy,
      title,
      amount,
      splitType: splitInput.splitType as SplitType,
      splits: { create: splits },
    },
    include: EXPENSE_INCLUDE,
  });
}
