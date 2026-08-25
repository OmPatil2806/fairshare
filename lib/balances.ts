import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Balance = { from: string; to: string; amount: Prisma.Decimal };

function addDirected(
  directed: Map<string, Map<string, Prisma.Decimal>>,
  ower: string,
  payer: string,
  amount: Prisma.Decimal
) {
  if (ower === payer) return;
  if (!directed.has(ower)) directed.set(ower, new Map());
  const owedToPayer = directed.get(ower)!;
  owedToPayer.set(payer, (owedToPayer.get(payer) ?? new Prisma.Decimal(0)).plus(amount));
}

// Nets every pairwise debt in the group: what each ExpenseSplit's userId
// owes the expense's payer, minus any Settlements already recorded between
// that same pair. Returns one entry per pair with a nonzero net balance.
export async function calculateGroupBalances(groupId: string): Promise<Balance[]> {
  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({ where: { groupId }, include: { splits: true } }),
    prisma.settlement.findMany({ where: { groupId } }),
  ]);

  const directed = new Map<string, Map<string, Prisma.Decimal>>();

  for (const expense of expenses) {
    for (const split of expense.splits) {
      addDirected(directed, split.userId, expense.paidBy, split.amountOwed);
    }
  }

  for (const settlement of settlements) {
    // A settlement from A to B reduces what A owes B.
    addDirected(
      directed,
      settlement.fromUserId,
      settlement.toUserId,
      settlement.amount.negated()
    );
  }

  const seenPairs = new Set<string>();
  const balances: Balance[] = [];

  for (const [a, owedByA] of directed) {
    for (const b of owedByA.keys()) {
      const pairKey = [a, b].sort().join("::");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const aOwesB = directed.get(a)?.get(b) ?? new Prisma.Decimal(0);
      const bOwesA = directed.get(b)?.get(a) ?? new Prisma.Decimal(0);
      const net = aOwesB.minus(bOwesA);

      if (net.isZero()) continue;

      balances.push(
        net.isPositive()
          ? { from: a, to: b, amount: net }
          : { from: b, to: a, amount: net.negated() }
      );
    }
  }

  return balances;
}

// Reduces pairwise balances to the minimum-ish set of transactions: compute
// each person's overall net position, then greedily settle the largest
// debtor against the largest creditor until everyone nets to zero.
export function simplifyDebts(balances: Balance[]): Balance[] {
  const net = new Map<string, Prisma.Decimal>();

  function addNet(userId: string, delta: Prisma.Decimal) {
    net.set(userId, (net.get(userId) ?? new Prisma.Decimal(0)).plus(delta));
  }

  for (const balance of balances) {
    addNet(balance.from, balance.amount.negated());
    addNet(balance.to, balance.amount);
  }

  const debtors: { userId: string; amount: Prisma.Decimal }[] = [];
  const creditors: { userId: string; amount: Prisma.Decimal }[] = [];

  for (const [userId, amount] of net) {
    if (amount.isNegative()) {
      debtors.push({ userId, amount: amount.abs() });
    } else if (amount.isPositive()) {
      creditors.push({ userId, amount });
    }
  }

  debtors.sort((a, b) => b.amount.comparedTo(a.amount));
  creditors.sort((a, b) => b.amount.comparedTo(a.amount));

  const transactions: Balance[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Prisma.Decimal.min(debtor.amount, creditor.amount);

    transactions.push({ from: debtor.userId, to: creditor.userId, amount: settled });

    debtor.amount = debtor.amount.minus(settled);
    creditor.amount = creditor.amount.minus(settled);

    if (debtor.amount.isZero()) i++;
    if (creditor.amount.isZero()) j++;
  }

  return transactions;
}
