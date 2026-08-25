import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";
import { calculateGroupBalances, simplifyDebts } from "@/lib/balances";
import { getDisplayName } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(
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

  const pairwise = await calculateGroupBalances(groupId);
  const simplified = simplifyDebts(pairwise);

  const userIds = Array.from(
    new Set(simplified.flatMap((b) => [b.from, b.to]))
  );
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const usersById = new Map(users.map((u) => [u.id, u]));

  const balances = simplified.map((b) => {
    const fromUser = usersById.get(b.from);
    const toUser = usersById.get(b.to);

    return {
      from: b.from,
      to: b.to,
      amount: b.amount.toFixed(2),
      fromName: fromUser ? getDisplayName(fromUser) : b.from,
      toName: toUser ? getDisplayName(toUser) : b.to,
    };
  });

  return NextResponse.json({ balances });
}
