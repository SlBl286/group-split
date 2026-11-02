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
    const { pushToken, deviceId } = body;

    const targetDeviceId = deviceId || currentDeviceId;
    if (!targetDeviceId || !pushToken) {
      return NextResponse.json(
        { error: "Thiếu pushToken hoặc deviceId" },
        { status: 400 }
      );
    }

    await prisma.userDevice.updateMany({
      where: {
        userId: user.id,
        deviceId: String(targetDeviceId),
      },
      data: {
        pushToken: String(pushToken),
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật push token thành công",
    });
  } catch (error) {
    console.error("[Update Push Token Error]:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật push token" },
      { status: 500 }
    );
  }
}

