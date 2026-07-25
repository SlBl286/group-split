import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

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

    const existingMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (existingMember && !existingMember.isLeft) return NextResponse.json({ error: "Bạn đã là thành viên của nhóm này" }, { status: 409 });

    const existingRequest = await prisma.groupJoinRequest.findFirst({
      where: { groupId, userId, status: "PENDING" },
    });
    if (existingRequest) {
      return NextResponse.json({ error: "Bạn đã gửi yêu cầu gia nhập nhóm này, đang chờ Trưởng nhóm phê duyệt" }, { status: 409 });
    }

    const joinRequest = await prisma.groupJoinRequest.create({
      data: {
        groupId,
        userId,
        status: "PENDING",
      },
    });

    // Notify Group Owner
    await createNotification({
      userId: group.ownerId,
      title: `Yêu cầu tham gia nhóm "${group.name}"`,
      content: `${session.user.name || "Người dùng"} muốn tham gia nhóm "${group.name}".`,
      type: "JOIN_REQUEST",
      entityId: joinRequest.id,
      link: `/notifications`,
    });

    return NextResponse.json(
      { message: "Đã gửi yêu cầu tham gia nhóm, đang chờ Trưởng nhóm phê duyệt", joinRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in join API:", error);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi trên hệ thống" },
      { status: 500 }
    );
  }
}
