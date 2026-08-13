import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as any;
  const isAdmin = user.username === "qy286" || user.role === "ADMIN";

  if (!isAdmin) return null;
  return user;
}

// 1. GET: Lấy cấu hình hệ thống & Thống kê Admin
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Quyền truy cập bị từ chối" }, { status: 403 });
  }

  try {
    const [totalUsers, totalGroups, totalExpenses, totalSettlements, settings] =
      await Promise.all([
        prisma.user.count(),
        prisma.group.count(),
        prisma.expense.count(),
        prisma.settlement.count(),
        prisma.systemSetting.findMany(),
      ]);

    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value])
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        totalGroups,
        totalExpenses,
        totalSettlements,
      },
      smtp: {
        host: settingsMap.SMTP_HOST || process.env.SMTP_HOST || "",
        port: settingsMap.SMTP_PORT || process.env.SMTP_PORT || "587",
        user: settingsMap.SMTP_USER || process.env.SMTP_USER || "",
        pass: settingsMap.SMTP_PASS || process.env.SMTP_PASS || "",
        from: settingsMap.SMTP_FROM || process.env.SMTP_FROM || "",
        secure: settingsMap.SMTP_SECURE || process.env.SMTP_SECURE || "false",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Lưu cấu hình SMTP trong bảng SystemSetting
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Quyền truy cập bị từ chối" }, { status: 403 });
  }

  try {
    const { host, port, user, pass, from, secure } = await req.json();

    const updates = [
      { key: "SMTP_HOST", value: host || "" },
      { key: "SMTP_PORT", value: String(port || "587") },
      { key: "SMTP_USER", value: user || "" },
      { key: "SMTP_PASS", value: pass || "" },
      { key: "SMTP_FROM", value: from || "" },
      { key: "SMTP_SECURE", value: String(!!secure) },
    ];

    for (const item of updates) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã lưu cấu hình Email SMTP thành công!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
