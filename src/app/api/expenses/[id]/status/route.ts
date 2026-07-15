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

  // Phát sóng tin nhắn cập nhật cho tất cả client
  eventEmitter.emit(`group:${expense.groupId}`, { type: "REFRESH" });

  return NextResponse.json(updated);
}
