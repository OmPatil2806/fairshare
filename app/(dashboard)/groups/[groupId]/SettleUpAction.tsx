"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SettleUpAction({
  groupId,
  fromUserId,
  toUserId,
  outstandingAmount,
  currencySymbol,
}: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  outstandingAmount: string;
  currencySymbol: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(outstandingAmount);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch(`/api/groups/${groupId}/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId, toUserId, amount }),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to record settlement");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setAmount(outstandingAmount);
          setError(null);
          setOpen(true);
        }}
        className="shrink-0 text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100"
      >
        Settle up
      </button>
    );
  }

  return (
    <form
      onSubmit={handleConfirm}
      className="mt-2 flex w-full flex-wrap items-center gap-2"
    >
      <span className="text-xs">{currencySymbol}</span>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        step="0.01"
        min="0"
        className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs underline opacity-80 hover:opacity-100"
      >
        Cancel
      </button>
      {error && (
        <p className="w-full text-xs font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
