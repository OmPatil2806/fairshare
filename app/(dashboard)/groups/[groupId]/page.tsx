import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGroupWithMembers } from "@/lib/groups";
import { getGroupExpenses } from "@/lib/expenses";
import { calculateGroupBalances, simplifyDebts } from "@/lib/balances";
import { getCurrencySymbol } from "@/lib/currency";
import { getDisplayName } from "@/lib/user";
import { InviteMemberForm } from "./InviteMemberForm";
import { AddExpenseForm } from "./AddExpenseForm";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const group = await getGroupWithMembers(groupId);
  const isMember = group?.members.some((m) => m.userId === user.id) ?? false;

  if (!group || !isMember) {
    redirect("/groups");
  }

  const expenses = await getGroupExpenses(group.id);
  const currencySymbol = getCurrencySymbol(group.currency);
  const members = group.members.map((m) => m.user);

  const membersById = new Map(group.members.map((m) => [m.userId, m.user]));
  const nameFor = (userId: string) => {
    const member = membersById.get(userId);
    return member ? getDisplayName(member) : "Someone";
  };

  const pairwiseBalances = await calculateGroupBalances(group.id);
  const simplifiedBalances = simplifyDebts(pairwiseBalances);
  const myBalances = simplifiedBalances.filter(
    (b) => b.from === user.id || b.to === user.id
  );
  const otherBalances = simplifiedBalances.filter(
    (b) => b.from !== user.id && b.to !== user.id
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {group.name} ({currencySymbol})
      </h1>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Balances
        </h2>
        {myBalances.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;re all settled up! 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {myBalances.map((balance, index) => {
              const youOwe = balance.from === user.id;
              return (
                <li
                  key={index}
                  className={
                    youOwe
                      ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                      : "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                  }
                >
                  {youOwe
                    ? `You owe ${nameFor(balance.to)} ${currencySymbol}${balance.amount.toFixed(2)}`
                    : `${nameFor(balance.from)} owes you ${currencySymbol}${balance.amount.toFixed(2)}`}
                </li>
              );
            })}
          </ul>
        )}

        {otherBalances.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Other balances in this group
            </h3>
            <ul className="space-y-2">
              {otherBalances.map((balance, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  {nameFor(balance.from)} owes {nameFor(balance.to)}{" "}
                  {currencySymbol}
                  {balance.amount.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Members
        </h2>
        <ul className="space-y-2">
          {group.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {getDisplayName(member.user)}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {member.user.email}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Invite member
        </h2>
        <InviteMemberForm groupId={group.id} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Add expense
        </h2>
        <AddExpenseForm
          groupId={group.id}
          members={members}
          currentUserId={user.id}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Expenses
        </h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No expenses yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {expense.title}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Paid by{" "}
                    {expense.payer.id === user.id
                      ? "you"
                      : getDisplayName(expense.payer)}{" "}
                    · {new Date(expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {currencySymbol}
                  {expense.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
