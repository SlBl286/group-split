import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[Auto Migrate DB] Bắt đầu kiểm tra và bổ sung cột CSDL...");

    // Bổ sung các cột mới nếu chưa có trong DB (An toàn 100%, bảo toàn dữ liệu cũ)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zaloChatId" TEXT;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "zaloChatId" TEXT;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "GroupMember" ADD COLUMN IF NOT EXISTS "isLeft" BOOLEAN DEFAULT false;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "GroupMember" ADD COLUMN IF NOT EXISTS "leftAt" TIMESTAMP(3);`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;`
    );

    return NextResponse.json({
      success: true,
      message: "🟢 Đã bổ sung tất cả cột mới vào CSDL trên Portainer thành công! Bảo toàn 100% dữ liệu cũ.",
    });
  } catch (err: any) {
    console.error("[Auto Migrate DB Error]:", err);
    return NextResponse.json(
      { error: "Lỗi đồng bộ DB", details: err.message },
      { status: 500 }
    );
  }
}
