import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function GET(request: Request) {
  try {
    const user = await getMobileAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Chưa xác thực" }, { status: 401 });
    }

    const currentDeviceId = request.headers.get("x-device-id");

    const devices = await prisma.userDevice.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        lastActiveAt: "desc",
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        platform: true,
        osVersion: true,
        appVersion: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    const formattedDevices = devices.map((d) => ({
      ...d,
      isCurrent: Boolean(currentDeviceId && d.deviceId === currentDeviceId),
    }));

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    });
  } catch (error) {
    console.error("[Get Mobile Devices Error]:", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách thiết bị" },
      { status: 500 }
    );
  }
}

