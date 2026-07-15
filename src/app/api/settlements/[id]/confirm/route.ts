import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id!;

  const settlement = await prisma.settlement.findUnique({ where: { id } });
  if (!settlement) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Only the creditor (toUser) can confirm
  if (settlement.toUserId !== userId)
    return NextResponse.json({ error: "Chỉ người nhận mới xác nhận được" }, { status: 403 });

  const updated = await prisma.settlement.update({
    where: { id },
    data: { isConfirmed: true },
  });

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${settlement.groupId}`, { type: "REFRESH" });

  return NextResponse.json(updated);
}
