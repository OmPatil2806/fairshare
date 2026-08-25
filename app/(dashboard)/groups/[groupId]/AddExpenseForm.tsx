"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getDisplayName } from "@/lib/user";

type Member = { id: string; name: string | null; email: string };
type SplitTypeOption = "EQUAL" | "CUSTOM" | "PERCENTAGE";

const SPLIT_TOLERANCE = 0.01;

export function AddExpenseForm({
  groupId,
  members,
  currentUserId,
  currencySymbol,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  currencySymbol: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitType, setSplitType] = useState<SplitTypeOption>("EQUAL");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    {}
  );
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const customTotal = members.reduce(
    (sum, m) => sum + (parseFloat(customAmounts[m.id]) || 0),
    0
  );
  const percentageTotal = members.reduce(
    (sum, m) => sum + (parseFloat(percentages[m.id]) || 0),
    0
  );

  const customValid =
    splitType !== "CUSTOM" ||
    Math.abs(customTotal - amountNum) <= SPLIT_TOLERANCE;
  const percentageValid =
    splitType !== "PERCENTAGE" ||
    Math.abs(percentageTotal - 100) <= SPLIT_TOLERANCE;

  const canSubmit = Boolean(
    title.trim() && amount && customValid && percentageValid && !pending
  );

  function displayName(member: Member) {
    return member.id === currentUserId ? "You" : getDisplayName(member);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setPending(true);

    const body: Record<string, unknown> = {
      title: title.trim(),
      amount,
      paidBy,
      splitType,
    };
    if (splitType === "CUSTOM") body.customAmounts = customAmounts;
    if (splitType === "PERCENTAGE") body.percentages = percentages;

    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add expense");
      return;
    }

    setTitle("");
    setAmount("");
    setPaidBy(currentUserId);
    setSplitType("EQUAL");
    setCustomAmounts({});
    setPercentages({});
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Expense title"
            className="min-w-[10rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            className="w-28 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {displayName(member)}
              </option>
            ))}
          </select>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitTypeOption)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="EQUAL">Equal</option>
            <option value="CUSTOM">Custom</option>
            <option value="PERCENTAGE">Percentage</option>
          </select>
        </div>

        {splitType === "CUSTOM" && (
          <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {displayName(member)}
                </span>
                <input
                  value={customAmounts[member.id] ?? ""}
                  onChange={(e) =>
                    setCustomAmounts((prev) => ({
                      ...prev,
                      [member.id]: e.target.value,
                    }))
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            ))}
            <p
              className={
                customValid
                  ? "text-xs text-zinc-500 dark:text-zinc-400"
                  : "text-xs font-medium text-red-600 dark:text-red-400"
              }
            >
              {currencySymbol}
              {customTotal.toFixed(2)} of {currencySymbol}
              {amountNum.toFixed(2)} allocated
            </p>
          </div>
        )}

        {splitType === "PERCENTAGE" && (
          <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {displayName(member)}
                </span>
                <input
                  value={percentages[member.id] ?? ""}
                  onChange={(e) =>
                    setPercentages((prev) => ({
                      ...prev,
                      [member.id]: e.target.value,
                    }))
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            ))}
            <p
              className={
                percentageValid
                  ? "text-xs text-zinc-500 dark:text-zinc-400"
                  : "text-xs font-medium text-red-600 dark:text-red-400"
              }
            >
              {percentageTotal.toFixed(2)}% of 100% allocated
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add expense"}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
