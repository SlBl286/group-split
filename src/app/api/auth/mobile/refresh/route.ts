import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken, signMobileTokens } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken, deviceId } = body;

    if (!refreshToken || !deviceId) {
      return NextResponse.json(
        { error: "Thiếu refreshToken hoặc deviceId" },
        { status: 400 }
      );
    }

    const payload = await verifyMobileToken(refreshToken);
    if (!payload || payload.tokenType !== "refresh") {
      return NextResponse.json(
        { error: "Refresh token không hợp lệ hoặc đã hết hạn" },
        { status: 401 }
      );
    }

    const device = await prisma.userDevice.findUnique({
      where: {
        userId_deviceId: {
          userId: payload.id,
          deviceId: String(deviceId),
        },
      },
      include: {
        user: true,
      },
    });

    if (!device || !device.isActive || !device.user) {
      return NextResponse.json(
        { error: "Thiết bị này đã bị đăng xuất hoặc bị thu hồi phiên" },
        { status: 401 }
      );
    }

    // Generate refreshed tokens
    const tokens = await signMobileTokens({
      id: device.user.id,
      username: device.user.username,
      displayName: device.user.displayName,
      role: device.user.role,
      email: device.user.email,
    });

    // Update lastActiveAt and new refreshToken
    await prisma.userDevice.update({
      where: { id: device.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("[Mobile Refresh Token Error]:", error);
    return NextResponse.json(
      { error: "Lỗi làm mới phiên đăng nhập" },
      { status: 500 }
    );
  }
}

