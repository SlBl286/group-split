import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Chưa xác thực" }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        email: true,
        isEmailVerified: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: fullUser,
    });
  } catch (error) {
    console.error("[Get Mobile Me Error]:", error);
    return NextResponse.json(
      { error: "Lỗi tải thông tin người dùng" },
      { status: 500 }
    );
  }
}

