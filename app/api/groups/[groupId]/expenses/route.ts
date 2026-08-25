import { NextResponse } from "next/server";
import { Prisma, SplitType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";
import {
  getGroupExpenses,
  createGroupExpense,
  SplitValidationError,
  type CreateExpenseInput,
} from "@/lib/expenses";

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

  const splitType =
    typeof body?.splitType === "string" ? body.splitType : "EQUAL";

  if (!Object.values(SplitType).includes(splitType)) {
    return NextResponse.json({ error: "Invalid split type" }, { status: 400 });
  }

  let splitInput: CreateExpenseInput;
  if (splitType === "CUSTOM") {
    if (typeof body?.customAmounts !== "object" || body.customAmounts === null) {
      return NextResponse.json(
        { error: "customAmounts is required for a custom split" },
        { status: 400 }
      );
    }
    splitInput = { splitType: "CUSTOM", customAmounts: body.customAmounts };
  } else if (splitType === "PERCENTAGE") {
    if (typeof body?.percentages !== "object" || body.percentages === null) {
      return NextResponse.json(
        { error: "percentages is required for a percentage split" },
        { status: 400 }
      );
    }
    splitInput = { splitType: "PERCENTAGE", percentages: body.percentages };
  } else {
    splitInput = { splitType: "EQUAL" };
  }

  let expense;
  try {
    expense = await createGroupExpense(groupId, title, amount, paidBy, splitInput);
  } catch (err) {
    if (err instanceof SplitValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ expense }, { status: 201 });
}
