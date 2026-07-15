import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, displayName, password } = await req.json();

    if (!username || !displayName || !password) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Tên đăng nhập đã được sử dụng" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
      },
    });

    return NextResponse.json(
      { id: user.id, username: user.username },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
