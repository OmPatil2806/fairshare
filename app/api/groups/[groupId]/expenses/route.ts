import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";
import { getGroupExpenses, createGroupExpense } from "@/lib/expenses";

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

  const expenses = await getGroupExpenses(groupId);
  return NextResponse.json({ expenses });
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
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const paidBy = typeof body?.paidBy === "string" ? body.paidBy : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!paidBy) {
    return NextResponse.json(
      { error: "paidBy is required" },
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

  if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
    return NextResponse.json(
      { error: "Amount must be greater than 0" },
      { status: 400 }
    );
  }

  if (!(await isGroupMember(groupId, paidBy))) {
    return NextResponse.json(
      { error: "paidBy must be a member of this group" },
      { status: 400 }
    );
  }

  const expense = await createGroupExpense(groupId, title, amount, paidBy);
  return NextResponse.json({ expense }, { status: 201 });
}
