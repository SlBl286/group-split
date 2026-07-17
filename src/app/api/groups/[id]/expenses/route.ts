import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { eventEmitter } from "@/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;
  const userId = session.user.id!;

  // Check membership
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership) return NextResponse.json({ error: "Không thuộc nhóm này" }, { status: 403 });

  const { title, description, amount, paidById, splitType, date, splits, category } =
    await req.json();

  if (!title || !amount || !paidById || !splits?.length) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  try {
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
        status: membership.role === "OWNER" ? "APPROVED" : "PENDING",
        category: category || "Khác",
        splits: {
          create: splits.map((s: { userId: string; amount: number }) => ({
            userId: s.userId,
            amount: s.amount,
          })),
        },
      },
      include: { splits: true },
    });

    // Phát sóng tin nhắn cập nhật cho tất cả client
    eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống khi tạo hoá đơn" },
      { status: 500 }
    );
  }
}
