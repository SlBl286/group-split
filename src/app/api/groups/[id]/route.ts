import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { eventEmitter } from "@/lib/events";
import { calculateDebts } from "@/lib/debt-calculator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;
    const userId = user.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
        fundManager: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatar: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        expenses: {
          include: {
            paidBy: { select: { id: true, displayName: true, username: true, avatar: true } },
            createdBy: { select: { id: true, displayName: true, username: true } },
            splits: {
              include: {
                user: { select: { id: true, displayName: true, username: true, avatar: true } },
              },
            },
            categoryRel: true,
          },
          orderBy: { date: "desc" },
        },
        settlements: {
          include: {
            fromUser: { select: { id: true, displayName: true, username: true, avatar: true } },
            toUser: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatar: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        fundAllocations: {
          include: {
            fromUser: { select: { id: true, displayName: true, username: true, avatar: true } },
            toUser: { select: { id: true, displayName: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        fundContributions: {
          include: {
            user: { select: { id: true, displayName: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        categories: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    }

    const membership = group.members.find((m) => m.userId === userId && !m.isLeft);
    if (!membership && group.ownerId !== userId && !user.isAdmin) {
      return NextResponse.json({ error: "Bạn không phải thành viên của nhóm này" }, { status: 403 });
    }

    // Calculate debts and balances
    const activeMembers = group.members.filter((m) => !m.isLeft);
    const approvedExpenses = group.expenses.filter((e) => e.status === "APPROVED");
    const { debts, balances } = calculateDebts(
      approvedExpenses as any,
      activeMembers as any,
      group.settlements as any,
      group.ownerId,
      group.fundAllocations as any
    );

    const userBalance = balances.find((b) => b.userId === userId)?.balance ?? 0;

    const totalExpensesAmount = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFundContributions = (group.fundContributions || [])
      .filter((fc) => fc.status === "CONFIRMED")
      .reduce((sum, fc) => sum + fc.amount, 0);
    const totalFundExpenses = approvedExpenses
      .filter((e) => e.fundingSource === "FUND")
      .reduce((sum, e) => sum + e.amount, 0);
    const currentFundBalance = totalFundContributions - totalFundExpenses;

    return NextResponse.json({
      success: true,
      group,
      debts,
      balances,
      userBalance,
      userRole: membership?.role || (group.ownerId === userId ? "OWNER" : "MEMBER"),
      stats: {
        totalExpensesAmount,
        totalFundContributions,
        totalFundExpenses,
        currentFundBalance,
      },
    });
  } catch (error: any) {
    console.error("GET group error:", error);
    return NextResponse.json({ error: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;
    const userId = user.id;

    // Verify group exists and user is owner
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    if (group.ownerId !== userId && !user.isAdmin) {
      return NextResponse.json(
        { error: "Chỉ trưởng nhóm mới được sửa cài đặt nhóm" },
        { status: 403 }
      );
    }

    let name: string;
    let description: string | null = null;
    let avatarFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      name = body.name;
      description = body.description || null;
    } else {
      const formData = await req.formData();
      name = formData.get("name") as string;
      description = formData.get("description") as string | null;
      avatarFile = formData.get("avatar") as File | null;
    }

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Tên nhóm không được để trống" }, { status: 400 });
    }

    let avatarUrl: string | undefined = undefined;

    // Handle group avatar upload
    if (avatarFile && avatarFile.size > 0 && avatarFile.name) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileExt = path.extname(avatarFile.name) || ".jpg";
      const fileName = `group-${groupId}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await writeFile(filePath, buffer);

      avatarUrl = `/uploads/${fileName}`;
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
      },
    });

    // Notify all members via real-time SSE
    eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (err: any) {
    console.error("Lỗi cập nhật cài đặt nhóm:", err);
    return NextResponse.json({ error: err.message || "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;
    const userId = user.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    }

    if (group.ownerId !== userId && !user.isAdmin) {
      return NextResponse.json(
        { error: "Chỉ trưởng nhóm mới có quyền xoá nhóm" },
        { status: 403 }
      );
    }

    const memberIdsToNotify = group.members
      .map((m) => m.userId)
      .filter((uid) => uid !== userId);

    await prisma.$transaction(async (tx) => {
      // 1. Xoá splits của các hoá đơn trong nhóm
      const expenses = await tx.expense.findMany({
        where: { groupId },
        select: { id: true },
      });
      const expenseIds = expenses.map((e) => e.id);
      if (expenseIds.length > 0) {
        await tx.expenseSplit.deleteMany({
          where: { expenseId: { in: expenseIds } },
        });
        await tx.expense.deleteMany({
          where: { groupId },
        });
      }

      // 2. Xoá settlements
      await tx.settlement.deleteMany({ where: { groupId } });

      // 3. Xoá fund allocations
      await tx.fundAllocation.deleteMany({ where: { groupId } });

      // 4. Xoá categories
      await tx.category.deleteMany({ where: { groupId } });

      // 5. Xoá group invitations & join requests
      await tx.groupInvitation.deleteMany({ where: { groupId } });
      await tx.groupJoinRequest.deleteMany({ where: { groupId } });

      // 6. Xoá members
      await tx.groupMember.deleteMany({ where: { groupId } });

      // 7. Xoá group
      await tx.group.delete({ where: { id: groupId } });
    });

    // Thông báo cho các thành viên còn lại
    const { createNotification } = await import("@/lib/notifications");
    for (const memberId of memberIdsToNotify) {
      createNotification({
        userId: memberId,
        title: `Nhóm đã bị giải tán`,
        content: `Trưởng nhóm đã giải tán và xoá nhóm "${group.name}".`,
        type: "MEMBER_LEFT",
        link: `/groups`,
      }).catch(console.error);
    }

    // Phát sóng sự kiện giải tán nhóm
    eventEmitter.emit(`group:${groupId}`, { type: "REFRESH" });

    return NextResponse.json({
      success: true,
      message: `Đã xoá nhóm "${group.name}" thành công`,
    });
  } catch (err: any) {
    console.error("Lỗi khi xoá nhóm:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi xoá nhóm" },
      { status: 500 }
    );
  }
}
