import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter } from "@/lib/events";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id!;

  try {
    const settlement = await prisma.settlement.findUnique({ where: { id } });
    if (!settlement) {
      return NextResponse.json({ error: "Không tìm thấy giao dịch" }, { status: 404 });
    }

    // Cho phép người gửi hủy giao dịch (khi đóng popup) hoặc người nhận từ chối (khi chưa nhận được tiền)
    if (settlement.fromUserId !== userId && settlement.toUserId !== userId) {
      return NextResponse.json(
        { error: "Bạn không có quyền hủy hoặc từ chối giao dịch này" },
        { status: 403 }
      );
    }

    // Xóa bản ghi settlement để hủy yêu cầu thanh toán
    await prisma.settlement.delete({ where: { id } });

    // Phát sóng tin nhắn cập nhật cho tất cả client
    eventEmitter.emit(`group:${settlement.groupId}`, { type: "REFRESH" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject settlement error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id!;

  try {
    const { note } = await req.json();

    const settlement = await prisma.settlement.findUnique({ where: { id } });
    if (!settlement) {
      return NextResponse.json({ error: "Không tìm thấy giao dịch" }, { status: 404 });
    }

    if (settlement.fromUserId !== userId) {
      return NextResponse.json(
        { error: "Bạn không có quyền chỉnh sửa giao dịch này" },
        { status: 403 }
      );
    }

    const updated = await prisma.settlement.update({
      where: { id },
      data: { note },
    });

    // Phát sóng tin nhắn cập nhật cho tất cả client
    eventEmitter.emit(`group:${settlement.groupId}`, { type: "REFRESH" });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update settlement error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
