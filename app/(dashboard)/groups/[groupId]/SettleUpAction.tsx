"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  inputBaseClass,
  buttonPrimarySmallClass,
  linkButtonClass,
  errorTextSmallClass,
} from "@/lib/ui";

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
        className={`shrink-0 ${linkButtonClass}`}
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
        className={`w-20 px-2 py-1 text-xs ${inputBaseClass}`}
      />
      <button
        type="submit"
        disabled={pending}
        className={buttonPrimarySmallClass}
      >
        {pending ? "Saving…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className={linkButtonClass}
      >
        Cancel
      </button>
      {error && <p className={`w-full ${errorTextSmallClass}`}>{error}</p>}
    </form>
  );
}
