import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember, addMemberToGroupByEmail } from "@/lib/groups";
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

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ members });
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
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const result = await addMemberToGroupByEmail(groupId, email, user.id);

  if (result.status === "user_not_found") {
    return NextResponse.json(
      {
        error:
          "This user hasn't signed up yet — ask them to create an account first",
      },
      { status: 404 }
    );
  }

  if (result.status === "already_member") {
    return NextResponse.json(
      { error: "This user is already a member of this group" },
      { status: 409 }
    );
  }

  return NextResponse.json({ member: result.member }, { status: 201 });
}
