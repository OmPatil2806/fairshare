import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGroupWithMembers } from "@/lib/groups";
import { getGroupExpenses } from "@/lib/expenses";
import { calculateGroupBalances, simplifyDebts } from "@/lib/balances";
import { getGroupSettlements } from "@/lib/settlements";
import { getGroupActivity } from "@/lib/activity";
import { getCurrencySymbol } from "@/lib/currency";
import { getDisplayName } from "@/lib/user";
import { cardClass, sectionHeadingClass, mutedTextClass } from "@/lib/ui";
import { InviteMemberForm } from "./InviteMemberForm";
import { AddExpenseForm } from "./AddExpenseForm";
import { SettleUpAction } from "./SettleUpAction";
import { SendReminderAction } from "./SendReminderAction";

function formatRelativeTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

  const settlements = await getGroupSettlements(group.id);
  const activity = await getGroupActivity(group.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold break-words text-zinc-900 dark:text-zinc-50">
        {group.name} ({currencySymbol})
      </h1>

      <section>
        <h2 className={sectionHeadingClass}>Balances</h2>
        {myBalances.length === 0 ? (
          <p className={mutedTextClass}>
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
                      ? "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                      : "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                  }
                >
                  <span>
                    {youOwe
                      ? `You owe ${nameFor(balance.to)} ${currencySymbol}${balance.amount.toFixed(2)}`
                      : `${nameFor(balance.from)} owes you ${currencySymbol}${balance.amount.toFixed(2)}`}
                  </span>
                  <span className="flex flex-wrap items-center gap-3">
                    <SettleUpAction
                      groupId={group.id}
                      fromUserId={balance.from}
                      toUserId={balance.to}
                      outstandingAmount={balance.amount.toFixed(2)}
                      currencySymbol={currencySymbol}
                    />
                    {!youOwe && (
                      <SendReminderAction
                        groupId={group.id}
                        toUserId={balance.from}
                      />
                    )}
                  </span>
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
                <li key={index} className={`${mutedTextClass} ${cardClass}`}>
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
        <h2 className={sectionHeadingClass}>Settlement History</h2>
        {settlements.length === 0 ? (
          <p className={mutedTextClass}>No settlements recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {settlements.map((settlement) => (
              <li key={settlement.id} className={`${mutedTextClass} ${cardClass}`}>
                {settlement.fromUserId === user.id ? "You" : settlement.fromName}{" "}
                paid{" "}
                {settlement.toUserId === user.id ? "you" : settlement.toName}{" "}
                {currencySymbol}
                {settlement.amount.toFixed(2)} ·{" "}
                {new Date(settlement.settledAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Activity</h2>
        {activity.length === 0 ? (
          <p className={mutedTextClass}>No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((entry) => (
              <li key={entry.id} className={`${mutedTextClass} ${cardClass}`}>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {entry.userId === user.id ? "You" : entry.actorName}
                </span>{" "}
                {entry.description} · {formatRelativeTime(entry.createdAt)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Members</h2>
        <ul className="space-y-2">
          {group.members.map((member) => (
            <li
              key={member.id}
              className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${cardClass}`}
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {getDisplayName(member.user)}
              </span>
              <span className={mutedTextClass}>{member.user.email}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Invite member</h2>
        <InviteMemberForm groupId={group.id} />
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Add expense</h2>
        <AddExpenseForm
          groupId={group.id}
          members={members}
          currentUserId={user.id}
          currencySymbol={currencySymbol}
        />
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Expenses</h2>
        {expenses.length === 0 ? (
          <p className={mutedTextClass}>
            No expenses yet — add one to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${cardClass}`}
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {expense.title}
                  </p>
                  <p className={mutedTextClass}>
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
