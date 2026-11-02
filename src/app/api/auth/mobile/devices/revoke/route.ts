import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Chưa xác thực" }, { status: 401 });
    }

    const currentDeviceId = request.headers.get("x-device-id");
    const body = await request.json();
    const { deviceId, revokeAllOthers } = body;

    if (revokeAllOthers) {
      if (!currentDeviceId) {
        return NextResponse.json(
          { error: "Thiếu định danh thiết bị hiện tại (X-Device-Id)" },
          { status: 400 }
        );
      }

      await prisma.userDevice.updateMany({
        where: {
          userId: user.id,
          deviceId: { not: currentDeviceId },
        },
        data: {
          isActive: false,
          refreshToken: null,
          pushToken: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã đăng xuất toàn bộ các thiết bị khác",
      });
    }

    if (!deviceId) {
      return NextResponse.json(
        { error: "Vui lòng chọn thiết bị cần thu hồi phiên" },
        { status: 400 }
      );
    }

    await prisma.userDevice.updateMany({
      where: {
        userId: user.id,
        deviceId: String(deviceId),
      },
      data: {
        isActive: false,
        refreshToken: null,
        pushToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã thu hồi phiên thiết bị thành công",
    });
  } catch (error) {
    console.error("[Revoke Device Error]:", error);
    return NextResponse.json(
      { error: "Lỗi thu hồi phiên thiết bị" },
      { status: 500 }
    );
  }
}

