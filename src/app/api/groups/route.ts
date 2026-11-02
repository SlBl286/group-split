import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { calculateDebts } from "@/lib/debt-calculator";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const { name, description } = await req.json();

  // Check if the user has filled bank info
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { bankName: true, accountNumber: true, accountName: true, sepayWebhookSecret: true, role: true, username: true },
  });

  const isAdmin = dbUser?.username === "qy286" || dbUser?.role === "ADMIN";

  if (!isAdmin && (!dbUser?.bankName || !dbUser?.accountNumber || !dbUser?.accountName)) {
    return NextResponse.json(
      { error: "Bạn cần hoàn tất cấu hình thông tin ngân hàng trong mục Cài đặt trước khi tạo nhóm mới để nhận chuyển khoản VietQR." },
      { status: 403 }
    );
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Tên nhóm không được để trống" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: { include: { user: true } },
      _count: { select: { expenses: true } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId, isLeft: false } } },
    include: {
      owner: { select: { id: true, displayName: true, username: true, avatar: true } },
      members: {
        where: { isLeft: false },
        include: {
          user: {
            select: { id: true, displayName: true, username: true, avatar: true, bankName: true, accountNumber: true, accountName: true },
          },
        },
      },
      expenses: {
        where: { status: "APPROVED" },
        include: { splits: true },
      },
      settlements: {
        where: { isConfirmed: true },
      },
      fundAllocations: true,
      _count: { select: { expenses: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate user balance for each group
  const formattedGroups = groups.map((g) => {
    const totalSpend = (g.expenses || []).reduce((sum: number, e: any) => sum + e.amount, 0);
    const { balances } = calculateDebts(
      g.expenses,
      g.members,
      g.settlements,
      g.ownerId,
      g.fundAllocations
    );

    const userBalance = balances.find((b) => b.userId === userId)?.balance ?? 0;

    return {
      id: g.id,
      name: g.name,
      description: g.description,
      avatar: g.avatar,
      inviteCode: g.inviteCode,
      currency: g.currency,
      createdAt: g.createdAt,
      ownerId: g.ownerId,
      owner: g.owner,
      memberCount: g.members.length,
      expenseCount: g._count.expenses,
      totalSpend,
      userBalance,
    };
  });

  return NextResponse.json(formattedGroups);
}
