import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendDirectTelegramTest } from "@/lib/telegram";

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
    if (group.ownerId !== userId) {
      return NextResponse.json({ error: "Chỉ trưởng nhóm mới thực hiện được" }, { status: 403 });
    }

    const { telegramChatId } = await req.json();
    if (!telegramChatId || !telegramChatId.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập Telegram Chat ID" }, { status: 400 });
    }

    await sendDirectTelegramTest(telegramChatId, group.name);

    return NextResponse.json({ success: true, message: "Đã gửi tin nhắn thử nghiệm tới Telegram nhóm thành công!" });
  } catch (err: any) {
    console.error("Test telegram error:", err);
    return NextResponse.json(
      { error: err.message || "Không thể gửi tin nhắn thử nghiệm Telegram." },
      { status: 400 }
    );
  }
}
