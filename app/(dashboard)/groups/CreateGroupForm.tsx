"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { inputClass, buttonPrimaryClass, errorTextClass } from "@/lib/ui";

const CURRENCY_OPTIONS = [
  { value: "INR", label: "₹ INR" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
] as const;

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<string>("INR");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setError(null);
    setPending(true);

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, currency }),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to create group");
      return;
    }

    setName("");
    setCurrency("INR");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New group name"
          className={`sm:flex-1 ${inputClass}`}
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={`sm:w-auto ${inputClass}`}
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className={`w-full sm:w-auto ${buttonPrimaryClass}`}
        >
          {pending ? "Creating…" : "Create group"}
        </button>
      </form>
      {error && <p className={`mt-2 ${errorTextClass}`}>{error}</p>}
    </div>
  );
}
