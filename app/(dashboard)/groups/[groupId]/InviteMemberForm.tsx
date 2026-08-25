"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { inputClass, buttonPrimaryClass, errorTextClass } from "@/lib/ui";

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setError(null);
    setPending(true);

    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add member");
      return;
    }

    setEmail("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Invite by email"
          className={`sm:flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`w-full sm:w-auto ${buttonPrimaryClass}`}
        >
          {pending ? "Adding…" : "Invite"}
        </button>
      </form>
      {error && <p className={`mt-2 ${errorTextClass}`}>{error}</p>}
    </div>
  );
}
