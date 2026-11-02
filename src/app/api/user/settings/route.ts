import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendVerificationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      isEmailVerified: true,
      avatar: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
      sepayWebhookSecret: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 });
  return NextResponse.json(dbUser);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  try {
    let displayName: string;
    let emailRaw: string | null = null;
    let bankName: string;
    let accountNumber: string;
    let accountName: string;
    let sepayWebhookSecret: string | null = null;
    let avatarFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      displayName = body.displayName;
      emailRaw = body.email || null;
      bankName = body.bankName;
      accountNumber = body.accountNumber;
      accountName = body.accountName;
      sepayWebhookSecret = body.sepayWebhookSecret || null;
    } else {
      const formData = await req.formData();
      displayName = formData.get("displayName") as string;
      emailRaw = formData.get("email") as string | null;
      bankName = formData.get("bankName") as string;
      accountNumber = formData.get("accountNumber") as string;
      accountName = formData.get("accountName") as string;
      sepayWebhookSecret = formData.get("sepayWebhookSecret") as string | null;
      avatarFile = formData.get("avatar") as File | null;
    }

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

    // Lấy thông tin user hiện tại
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, isEmailVerified: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 });
    }

    let emailData: {
      email?: string | null;
      isEmailVerified?: boolean;
      emailVerificationToken?: string | null;
      emailVerificationExpires?: Date | null;
    } = {};

    let emailChanged = false;
    let otpGenerated = false;

    // Kiểm tra và xử lý email
    if (emailRaw !== null && emailRaw !== undefined) {
      const cleanEmail = emailRaw.trim().toLowerCase();
      if (cleanEmail === "") {
        // Người dùng xóa email
        emailData = {
          email: null,
          isEmailVerified: false,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        };
      } else if (cleanEmail !== currentUser.email?.toLowerCase()) {
        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return NextResponse.json(
            { error: "Định dạng email không hợp lệ" },
            { status: 400 }
          );
        }

        // Kiểm tra email đã có người dùng khác sử dụng chưa
        const existingEmailUser = await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: "insensitive" },
            id: { not: userId },
          },
        });

        if (existingEmailUser) {
          return NextResponse.json(
            { error: "Email này đã được sử dụng bởi tài khoản khác" },
            { status: 400 }
          );
        }

        // Tạo mã OTP 6 số
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

        emailData = {
          email: cleanEmail,
          isEmailVerified: false,
          emailVerificationToken: otpCode,
          emailVerificationExpires: otpExpires,
        };

        // Gửi mã OTP xác thực email
        try {
          await sendVerificationEmail(cleanEmail, otpCode, currentUser.username);
          otpGenerated = true;
          emailChanged = true;
        } catch (mailErr) {
          console.error("Lỗi gửi email xác thực:", mailErr);
        }
      }
    }

    let avatarUrl: string | undefined = undefined;

    // Nếu người dùng tải lên file ảnh đại diện mới
    if (avatarFile && avatarFile.size > 0 && avatarFile.name) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileExt = path.extname(avatarFile.name) || ".jpg";
      const fileName = `${userId}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await writeFile(filePath, buffer);

      avatarUrl = `/uploads/${fileName}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
        ...emailData,
        bankName,
        accountNumber,
        accountName,
        sepayWebhookSecret: sepayWebhookSecret || null,
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      isEmailVerified: updatedUser.isEmailVerified,
      emailChanged,
      otpGenerated,
      avatar: updatedUser.avatar,
      bankName: updatedUser.bankName,
      accountNumber: updatedUser.accountNumber,
      accountName: updatedUser.accountName,
    });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
