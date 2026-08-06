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
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;
    const userId = session.user.id!;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });

    // Fund manager defaults to group owner if not set
    const isFundManager =
      group.fundManagerId === userId ||
      (group.fundManagerId === null && group.ownerId === userId);

    if (!isFundManager) {
      return NextResponse.json(
        { error: "Chỉ người quản lý quỹ mới được cấp tiền quỹ" },
        { status: 403 }
      );
    }

    const { amount, date, note, recipientIds } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Số tiền cấp quỹ phải lớn hơn 0" }, { status: 400 });
    }

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "Phải chọn ít nhất 1 thành viên nhận quỹ" }, { status: 400 });
    }

    // Verify all recipients are members of the group
    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: recipientIds },
      },
    });

    if (members.length !== recipientIds.length) {
      return NextResponse.json(
        { error: "Một số người nhận không thuộc nhóm này" },
        { status: 400 }
      );
    }

    // Create FundAllocation records
    const allocationsData = recipientIds.map((recipientId) => ({
      amount: parseFloat(amount),
      note: note || null,
      date: date ? new Date(date) : new Date(),
      groupId,
      fromUserId: userId,
      toUserId: recipientId,
    }));

    await prisma.fundAllocation.createMany({
      data: allocationsData,
    });

    // Phát sự kiện cập nhật realtime qua SSE
    eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

    // Gửi thông báo Telegram
    const managerUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });
    const singleAmt = parseFloat(amount);
    const totalAmount = singleAmt * recipientIds.length;
    const msg = `🏦 <b>[Thông báo cấp quỹ nhóm]</b>
Người quản lý: <b>${managerUser?.displayName || "Quản lý quỹ"}</b>
💰 Mức cấp: <b>${formatVND(singleAmt)}</b> / người
👥 Số người nhận: <b>${recipientIds.length} thành viên</b> (Tổng: <b>${formatVND(totalAmount)}</b>)
📝 Ghi chú: ${note || "Cấp quỹ hoạt động nhóm"}`;

    sendGroupTelegramNotification(groupId, msg);

    return NextResponse.json({ success: true, count: allocationsData.length }, { status: 201 });
  } catch (err: any) {
    console.error("Lỗi cấp tiền quỹ:", err);
    return NextResponse.json({ error: err.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
