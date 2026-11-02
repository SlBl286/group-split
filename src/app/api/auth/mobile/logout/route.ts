import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    const currentDeviceId = request.headers.get("x-device-id");

    if (user && currentDeviceId) {
      await prisma.userDevice.updateMany({
        where: {
          userId: user.id,
          deviceId: currentDeviceId,
        },
        data: {
          isActive: false,
          refreshToken: null,
          pushToken: null,
          lastActiveAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đăng xuất thiết bị thành công",
    });
  } catch (error) {
    console.error("[Mobile Logout Error]:", error);
    return NextResponse.json(
      { error: "Lỗi đăng xuất thiết bị" },
      { status: 500 }
    );
  }
}

