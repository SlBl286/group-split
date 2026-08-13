import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";
import { createNotification } from "@/lib/notifications";
import { formatVND } from "@/lib/utils/format";
import { sendUserZaloNotification } from "@/lib/zalo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const userId = session.user.id!;

  // Check group & membership
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true, fundManagerId: true },
  });
  if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership) return NextResponse.json({ error: "Không thuộc nhóm này" }, { status: 403 });

  const { title, description, amount, paidById, splitType, date, splits, category, categoryId } =
    await req.json();

  if (!title || !amount || !paidById || !splits?.length) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  // Tự động duyệt hoá đơn nếu do chính trưởng nhóm hoặc quản lý quỹ tạo
  const isAutoApproved =
    membership.role === "OWNER" ||
    group.ownerId === userId ||
    group.fundManagerId === userId ||
    (group.fundManagerId === null && group.ownerId === userId);

  try {
    const isApproved = membership.role === "OWNER";
    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount,
        paidById,
        splitType,
        date: date ? new Date(date) : new Date(),
        groupId,
        createdById: userId,
        status: isApproved ? "APPROVED" : "PENDING",
        category: category || "Khác",
        categoryId: categoryId || null,
        splits: {
          create: splits.map((s: { userId: string; amount: number }) => ({
            userId: s.userId,
            amount: s.amount,
          })),
        },
      },
      include: { splits: true, paidBy: { select: { displayName: true } } },
    });

    // Notify Owner if pending approval
    if (!isApproved && group.ownerId !== userId) {
      await createNotification({
        userId: group.ownerId,
        title: `Hóa đơn mới chờ duyệt`,
        content: `${session.user.name || "Thành viên"} đã tạo hóa đơn "${title}" (${formatVND(amount)}) cần bạn duyệt.`,
        type: "EXPENSE_PENDING",
        link: `/groups/${groupId}`,
        entityId: expense.id,
      });
    }

    // Phát sóng tin nhắn cập nhật cho tất cả client
    eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

    // Gửi thông báo Zalo Bot cá nhân cho từng người dùng kèm số tiền phần của người đó
    const statusText = isAutoApproved ? "🟢 Đã tự động duyệt" : "⏳ Chờ Trưởng nhóm duyệt";
    const targetUserIds = Array.from(
      new Set([paidById, ...expense.splits.map((s) => s.userId)])
    );

    for (const targetUserId of targetUserIds) {
      const userSplit = expense.splits.find((s) => s.userId === targetUserId);
      const isPayer = targetUserId === paidById;
      const payerNote = isPayer ? " (Bạn đã trả)" : "";

      const shareLine = userSplit
        ? `💵 Phần của bạn: ${formatVND(userSplit.amount)}`
        : "";

      const msg = `🧾 [Hóa đơn mới]
📌 ${title}
💰 Tổng hóa đơn: ${formatVND(amount)}
${shareLine ? `${shareLine}\n` : ""}👤 Người chi: ${expense.paidBy.displayName}${payerNote}
🏷️ Danh mục: ${category || "Khác"}
📌 Trạng thái: ${statusText}`;

      sendUserZaloNotification(targetUserId, msg);
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống khi tạo hoá đơn" },
      { status: 500 }
    );
  }
}
