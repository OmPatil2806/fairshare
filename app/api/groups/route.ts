import { NextResponse } from "next/server";
import { Currency } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getUserGroups, createGroupForUser } from "@/lib/groups";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await getUserGroups(user.id);
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }

  let currency: Currency | undefined;
  if (body?.currency !== undefined) {
    if (!Object.values(Currency).includes(body.currency)) {
      return NextResponse.json(
        { error: "Invalid currency" },
        { status: 400 }
      );
    }
    currency = body.currency as Currency;
  }

  const group = await createGroupForUser(user.id, name, currency);
  return NextResponse.json({ group }, { status: 201 });
}
