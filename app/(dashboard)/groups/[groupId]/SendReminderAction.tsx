"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  linkButtonClass,
  errorTextSmallClass,
  successTextSmallClass,
} from "@/lib/ui";

export function SendReminderAction({
  groupId,
  toUserId,
}: {
  groupId: string;
  toUserId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("sending");
    setMessage(null);

    const res = await fetch(`/api/groups/${groupId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatus("error");
      setMessage(data?.error ?? "Failed to send reminder");
      return;
    }

    setStatus("sent");
    setMessage("Reminder sent!");
    router.refresh();
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "sending"}
        className={`shrink-0 ${linkButtonClass}`}
      >
        {status === "sending" ? "Sending…" : "Send reminder"}
      </button>
      {message && (
        <span
          className={
            status === "error" ? errorTextSmallClass : successTextSmallClass
          }
        >
          {message}
        </span>
      )}
    </span>
  );
}
