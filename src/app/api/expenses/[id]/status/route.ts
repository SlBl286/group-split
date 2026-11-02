import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";
import { createNotification } from "@/lib/notifications";
import { sendUserZaloNotification, sendMultipleUsersZaloNotification } from "@/lib/zalo";
import { formatVND } from "@/lib/utils/format";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: expenseId } = await params;
  const userId = user.id;
  const { status } = await req.json();

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      group: true,
      splits: true,
      paidBy: { select: { displayName: true } },
      createdBy: { select: { displayName: true } },
    },
  });

  if (!expense) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (expense.group.ownerId !== userId)
    return NextResponse.json({ error: "Chỉ Trưởng nhóm mới có quyền duyệt hoá đơn" }, { status: 403 });

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status },
  });

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${expense.groupId}`, { type: "REFRESH" });

  if (status === "APPROVED") {
    // 1. Thông báo In-app cho người tạo hóa đơn (nếu người tạo không phải là người duyệt)
    if (expense.createdById !== userId) {
      await createNotification({
        userId: expense.createdById,
        title: `Hóa đơn đã được duyệt`,
        content: `Hóa đơn "${expense.title}" đã được Trưởng nhóm phê duyệt.`,
        type: "EXPENSE_APPROVED",
        link: `/groups/${expense.groupId}`,
        entityId: expense.id,
      });
    }

    // 2. Thông báo In-app cho từng người có phần chia tiền (splits)
    for (const split of expense.splits) {
      if (split.userId !== userId && split.userId !== expense.createdById) {
        const sharesSuffix = split.shares && split.shares !== 1 ? ` (x${split.shares} suất)` : "";
        await createNotification({
          userId: split.userId,
          title: `Hóa đơn mới liên quan đến bạn`,
          content: `Hóa đơn "${expense.title}" (${formatVND(expense.amount)}) đã được duyệt. Phần của bạn: ${formatVND(split.amount)}${sharesSuffix}.`,
          type: "EXPENSE_APPROVED",
          link: `/groups/${expense.groupId}`,
          entityId: expense.id,
        });
      }
    }

    // 3. Thông báo In-app cho người chi trả nếu người chi trả chưa nhận qua 2 điều kiện trên
    if (
      expense.paidById !== userId &&
      expense.paidById !== expense.createdById &&
      !expense.splits.some((s) => s.userId === expense.paidById)
    ) {
      await createNotification({
        userId: expense.paidById,
        title: `Hóa đơn đã được duyệt`,
        content: `Hóa đơn "${expense.title}" (${formatVND(expense.amount)}) do bạn chi trả đã được Trưởng nhóm phê duyệt.`,
        type: "EXPENSE_APPROVED",
        link: `/groups/${expense.groupId}`,
        entityId: expense.id,
      });
    }

    // 4. Gửi thông báo Zalo Bot cá nhân cho tất cả người liên quan kèm số tiền phần của người đó
    const targetUserIds = Array.from(
      new Set([expense.createdById, expense.paidById, ...expense.splits.map((s) => s.userId)])
    );

    for (const targetUserId of targetUserIds) {
      const userSplit = expense.splits.find((s) => s.userId === targetUserId);
      const isPayer = targetUserId === expense.paidById;
      const payerNote = isPayer ? " (Bạn đã trả)" : "";
      const sharesSuffix = userSplit?.shares && userSplit.shares !== 1 ? ` (x${userSplit.shares} suất)` : "";

      const shareLine = userSplit
        ? `💵 Phần của bạn: ${formatVND(userSplit.amount)}${sharesSuffix}`
        : "";

      const noteLines = [
        `🧾 [Hóa đơn đã được duyệt]`,
        `👥 Nhóm: ${expense.group.name}`,
        `📌 Khoản chi: ${expense.title}`,
        `💰 Tổng tiền: ${formatVND(expense.amount)}`,
        `👤 Người trả: ${expense.paidBy.displayName}${payerNote}`,
        shareLine,
        `✅ Người duyệt: ${user.name || "Trưởng nhóm"}`,
      ]
        .filter(Boolean)
        .join("\n");

      sendUserZaloNotification(targetUserId, noteLines);
    }
  } else if (status === "REJECTED") {
    // Thông báo cho người tạo khi bị từ chối
    if (expense.createdById !== userId) {
      await createNotification({
        userId: expense.createdById,
        title: `Hóa đơn bị từ chối`,
        content: `Hóa đơn "${expense.title}" đã bị Trưởng nhóm từ chối duyệt.`,
        type: "EXPENSE_PENDING",
        link: `/groups/${expense.groupId}`,
        entityId: expense.id,
      });
    }

    sendUserZaloNotification(
      expense.createdById,
      `❌ [Hóa đơn bị từ chối]\n👥 Nhóm: ${expense.group.name}\n📌 Khoản chi: ${expense.title}\n💰 Số tiền: ${formatVND(expense.amount)}\nNgười duyệt đã từ chối hóa đơn này.`
    );
  }

  return NextResponse.json({ success: true, expense: updated });
}
