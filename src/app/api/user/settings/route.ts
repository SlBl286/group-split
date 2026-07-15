import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id!;

  try {
    const formData = await req.formData();
    const displayName = formData.get("displayName") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountName = formData.get("accountName") as string;
    const sepayWebhookSecret = formData.get("sepayWebhookSecret") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    if (!displayName) {
      return NextResponse.json(
        { error: "Tên hiển thị là bắt buộc" },
        { status: 400 }
      );
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Thông tin ngân hàng là bắt buộc" },
        { status: 400 }
      );
    }

    let avatarUrl: string | undefined = undefined;

    // Nếu người dùng tải lên file ảnh đại diện mới
    if (avatarFile && avatarFile.size > 0 && avatarFile.name) {
      // Thư mục lưu trữ static của Next.js (phục vụ cho việc bind mount)
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileExt = path.extname(avatarFile.name) || ".jpg";
      const fileName = `${userId}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await writeFile(filePath, buffer);

      avatarUrl = `/uploads/${fileName}`;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
        bankName,
        accountNumber,
        accountName,
        sepayWebhookSecret: sepayWebhookSecret || null,
      },
    });

    return NextResponse.json({
      id: user.id,
      displayName: user.displayName,
      avatar: user.avatar,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      accountName: user.accountName,
    });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
