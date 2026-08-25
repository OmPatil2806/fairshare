import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isGroupMember } from "@/lib/groups";
import { getGroupActivity } from "@/lib/activity";

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

  const activity = await getGroupActivity(groupId);
  return NextResponse.json({ activity });
}
