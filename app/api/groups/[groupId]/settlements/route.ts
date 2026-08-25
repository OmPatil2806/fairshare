import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";
import {
  recordSettlement,
  getGroupSettlements,
  SettlementValidationError,
} from "@/lib/settlements";

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

  const settlements = await getGroupSettlements(groupId);
  return NextResponse.json({ settlements });
}

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
  const bodyFromUserId =
    typeof body?.fromUserId === "string" ? body.fromUserId : undefined;
  const bodyToUserId =
    typeof body?.toUserId === "string" ? body.toUserId : undefined;

  if (!bodyFromUserId && !bodyToUserId) {
    return NextResponse.json(
      { error: "fromUserId or toUserId is required" },
      { status: 400 }
    );
  }

  const fromUserId = bodyFromUserId ?? user.id;
  const toUserId = bodyToUserId ?? user.id;

  if (fromUserId === toUserId) {
    return NextResponse.json(
      { error: "fromUserId and toUserId must be different" },
      { status: 400 }
    );
  }

  if (user.id !== fromUserId && user.id !== toUserId) {
    return NextResponse.json(
      { error: "You are not a party to this settlement" },
      { status: 403 }
    );
  }

  const otherUserId = fromUserId === user.id ? toUserId : fromUserId;
  if (!(await isGroupMember(groupId, otherUserId))) {
    return NextResponse.json(
      { error: "The other party must be a member of this group" },
      { status: 400 }
    );
  }

  let amount: Prisma.Decimal;
  try {
    amount = new Prisma.Decimal(String(body?.amount ?? "")).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
  } catch {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  let settlement;
  try {
    settlement = await recordSettlement(
      groupId,
      fromUserId,
      toUserId,
      amount,
      user.id
    );
  } catch (err) {
    if (err instanceof SettlementValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ settlement }, { status: 201 });
}
