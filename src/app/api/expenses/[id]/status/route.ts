import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";
import { createNotification } from "@/lib/notifications";

import { sendGroupTelegramNotification } from "@/lib/telegram";
import { formatVND } from "@/lib/utils/format";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: expenseId } = await params;
  const userId = session.user.id!;
  const { status } = await req.json();

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { group: true },
  });

  if (!expense) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (expense.group.ownerId !== userId)
    return NextResponse.json({ error: "Chỉ owner mới duyệt được" }, { status: 403 });

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status },
  });

  // Notify expense creator
  if (expense.createdById !== userId) {
    if (status === "APPROVED") {
      await createNotification({
        userId: expense.createdById,
        title: `Hóa đơn đã được duyệt`,
        content: `Hóa đơn "${expense.title}" đã được Trưởng nhóm phê duyệt.`,
        type: "EXPENSE_APPROVED",
        link: `/groups/${expense.groupId}`,
        entityId: expense.id,
      });
    } else if (status === "REJECTED") {
      await createNotification({
        userId: expense.createdById,
        title: `Hóa đơn bị từ chối`,
        content: `Hóa đơn "${expense.title}" đã bị Trưởng nhóm từ chối.`,
        type: "EXPENSE_REJECTED",
        link: `/groups/${expense.groupId}`,
        entityId: expense.id,
      });
    }
  }

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${expense.groupId}`, { type: "REFRESH" });

  // Gửi thông báo Telegram
  const isApproved = status === "APPROVED";
  const icon = isApproved ? "✅" : "❌";
  const statusLabel = isApproved ? "Đã phê duyệt" : "Đã từ chối";
  const msg = `${icon} <b>[Xử lý hóa đơn]</b>
Hóa đơn: <b>${expense.title}</b> (<b>${formatVND(expense.amount)}</b>)
Trạng thái: <b>${statusLabel}</b> bởi Trưởng nhóm`;

  sendGroupTelegramNotification(expense.groupId, msg);

  return NextResponse.json(updated);
}
