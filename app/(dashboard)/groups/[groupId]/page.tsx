import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGroupWithMembers } from "@/lib/groups";
import { getGroupExpenses } from "@/lib/expenses";
import { getCurrencySymbol } from "@/lib/currency";
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

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {group.name} ({currencySymbol})
      </h1>

      <section>
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
                {member.user.name ?? member.user.email}
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
                      : (expense.payer.name ?? expense.payer.email)}{" "}
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
