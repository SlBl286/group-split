import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";

import { sendGroupTelegramNotification } from "@/lib/telegram";
import { formatVND } from "@/lib/utils/format";

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
    data: {
      isConfirmed: true,
      // Xóa tiền tố [QR_PENDING] nếu còn
      note: settlement.note?.startsWith("[QR_PENDING]")
        ? settlement.note.replace(/^\[QR_PENDING\]\s*/, "")
        : settlement.note,
    },
    include: {
      fromUser: { select: { displayName: true } },
      toUser: { select: { displayName: true } },
    },
  });

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${settlement.groupId}`, { type: "REFRESH" });

  // Gửi thông báo Telegram
  const msg = `🎉 <b>[Xác nhận nhận tiền]</b>
<b>${updated.toUser.displayName}</b> đã xác nhận nhận <b>${formatVND(updated.amount)}</b> từ <b>${updated.fromUser.displayName}</b>.
📌 Giao dịch hoàn tất!`;

  sendGroupTelegramNotification(updated.groupId, msg);

  return NextResponse.json(updated);
}
