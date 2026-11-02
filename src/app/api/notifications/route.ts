import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { enrichNotifications } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const [rawNotifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({
      where: { userId, status: "UNREAD" },
    }),
  ]);

  const notifications = await enrichNotifications(rawNotifications);

  return NextResponse.json({
    success: true,
    notifications,
    unreadCount,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const body = await req.json().catch(() => ({}));

  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId, status: "UNREAD" },
      data: { status: "READ" },
    });
    return NextResponse.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
  }

  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId },
      data: { status: "READ" },
    });
    return NextResponse.json({ success: true, message: "Đã đánh dấu đã đọc" });
  }

  return NextResponse.json({ error: "Tham số không hợp lệ" }, { status: 400 });
}
