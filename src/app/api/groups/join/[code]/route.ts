import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendUserZaloNotification } from "@/lib/zalo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await params;
    const userId = user.id;

    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
      include: { owner: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Mã mời nhóm không tồn tại hoặc đã hết hạn" }, { status: 404 });
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: group.id } },
    });

    if (existingMember && !existingMember.isLeft) {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        groupId: group.id,
        groupName: group.name,
      });
    }

    let member;
    if (existingMember && existingMember.isLeft) {
      member = await prisma.groupMember.update({
        where: { id: existingMember.id },
        data: { isLeft: false, leftAt: null },
      });
    } else {
      member = await prisma.groupMember.create({
        data: { userId, groupId: group.id, role: "MEMBER" },
      });
    }

    // Send notifications
    const msg = `👋 [Thành viên mới gia nhập nhóm ${group.name}]
${user.name || user.username} vừa gia nhập nhóm của bạn! 🎉`;
    sendUserZaloNotification(group.ownerId, msg);

    return NextResponse.json({
      success: true,
      groupId: group.id,
      groupName: group.name,
      member,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in join by code API:", error);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi tham gia nhóm" },
      { status: 500 }
    );
  }
}

