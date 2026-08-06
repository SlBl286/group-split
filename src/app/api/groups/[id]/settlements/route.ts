import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";

import { sendGroupTelegramNotification } from "@/lib/telegram";
import { formatVND } from "@/lib/utils/format";

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
    include: {
      fromUser: { select: { displayName: true } },
      toUser: { select: { displayName: true } },
    },
  });

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

  // Gửi thông báo Telegram
  const cleanNote = note ? note.replace(/^\[QR_PENDING\]\s*/, "") : "Chuyển khoản / Tiền mặt";
  const msg = `💸 <b>[Thông báo chuyển tiền]</b>
<b>${settlement.fromUser.displayName}</b> ➔ <b>${settlement.toUser.displayName}</b>
💰 Số tiền: <b>${formatVND(amount)}</b>
📝 Chi tiết: ${cleanNote}
⏳ Trạng thái: Đã chuyển (Chờ xác nhận)`;

  sendGroupTelegramNotification(groupId, msg);

  return NextResponse.json(settlement, { status: 201 });
}
