import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";
import { calculateGroupBalances, simplifyDebts } from "@/lib/balances";
import { getCurrencySymbol } from "@/lib/currency";
import { getDisplayName } from "@/lib/user";
import { sendReminderEmail } from "@/lib/email";
import { logActivity, ActivityActionType } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isGroupMember(groupId, user.id))) {
    return NextResponse.json(
      { error: "You are not a member of this group" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const toUserId = typeof body?.toUserId === "string" ? body.toUserId : "";

  if (!toUserId) {
    return NextResponse.json(
      { error: "toUserId is required" },
      { status: 400 }
    );
  }

  const pairwise = await calculateGroupBalances(groupId);
  const simplified = simplifyDebts(pairwise);
  const outstanding = simplified.find(
    (b) => b.from === toUserId && b.to === user.id
  );

  if (!outstanding) {
    return NextResponse.json(
      { error: "This person doesn't currently owe you anything in this group" },
      { status: 400 }
    );
  }

  const [group, recipient] = await Promise.all([
    prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      select: { name: true, currency: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: toUserId },
      select: { name: true, email: true },
    }),
  ]);

  let result;
  try {
    result = await sendReminderEmail({
      toEmail: recipient.email,
      toName: getDisplayName(recipient),
      fromName: getDisplayName(user),
      amount: outstanding.amount.toFixed(2),
      currencySymbol: getCurrencySymbol(group.currency),
      groupName: group.name,
    });
  } catch (err) {
    console.error("Failed to send reminder email", err);
    return NextResponse.json(
      { error: "Failed to send reminder email. Please try again later." },
      { status: 502 }
    );
  }

  if (result.error) {
    console.error("Resend returned an error", result.error);
    return NextResponse.json(
      { error: result.error.message || "Failed to send reminder email" },
      { status: 502 }
    );
  }

  await logActivity(
    groupId,
    user.id,
    ActivityActionType.REMINDER_SENT,
    `sent a payment reminder to ${getDisplayName(recipient)}`
  );

  return NextResponse.json({ success: true });
}
