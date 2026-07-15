import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const userId = session.user.id!;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership)
    return NextResponse.json({ error: "Không thuộc nhóm này" }, { status: 403 });

  const { fromUserId, toUserId, amount, note } = await req.json();

  // Only the debtor can mark as paid
  if (fromUserId !== userId)
    return NextResponse.json({ error: "Chỉ người nợ mới đánh dấu được" }, { status: 403 });

  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      fromUserId,
      toUserId,
      amount,
      note,
      isConfirmed: false,
    },
  });

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

  return NextResponse.json(settlement, { status: 201 });
}
