import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const userId = session.user.id!;

  // Only owner can add members by username
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
  if (group.ownerId !== userId)
    return NextResponse.json({ error: "Chỉ owner mới thêm thành viên được" }, { status: 403 });

  const { username } = await req.json();

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser)
    return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: targetUser.id, groupId } },
  });
  if (existing)
    return NextResponse.json({ error: "Thành viên đã trong nhóm" }, { status: 409 });

  const member = await prisma.groupMember.create({
    data: { userId: targetUser.id, groupId, role: "MEMBER" },
    include: { user: true },
  });

  return NextResponse.json(member, { status: 201 });
}
