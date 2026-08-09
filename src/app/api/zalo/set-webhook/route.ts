import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getZaloApiUrl } from "@/lib/zalo";

// 1. GET: Lấy thông tin Webhook hiện tại (getWebhookInfo)
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = process.env.ZALO_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Chưa cấu hình ZALO_BOT_TOKEN trong file .env" },
        { status: 400 }
      );
    }

    const apiUrl = getZaloApiUrl("getWebhookInfo", token);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Đăng ký Webhook URL (setWebhook)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = process.env.ZALO_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Chưa cấu hình ZALO_BOT_TOKEN trong file .env" },
        { status: 400 }
      );
    }

    const { webhookUrl, secretToken } = await req.json().catch(() => ({}));

    if (!webhookUrl || !webhookUrl.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập Webhook URL hợp lệ (phải có https://)" },
        { status: 400 }
      );
    }

    const apiUrl = getZaloApiUrl("setWebhook", token);
    // secret_token bắt buộc từ 8 tới 256 ký tự theo tài liệu Zalo Bot API
    const secret =
      secretToken && secretToken.trim().length >= 8
        ? secretToken.trim()
        : process.env.ZALO_BOT_SECRET_TOKEN && process.env.ZALO_BOT_SECRET_TOKEN.trim().length >= 8
        ? process.env.ZALO_BOT_SECRET_TOKEN.trim()
        : "9a48f76378e9b6a12df387ef98acdebf9a48f76378e9b6a12df387ef98acdebf";

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        secret_token: secret,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { error: data.description || data.message || "Thiết lập Webhook thất bại" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã đăng ký Webhook thành công với Zalo Bot Platform!",
      secretUsed: secret,
      data,
    });
  } catch (err: any) {
    console.error("Set Webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi khi gọi API setWebhook" },
      { status: 500 }
    );
  }
}

// 3. DELETE: Hủy bỏ Webhook (deleteWebhook)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = process.env.ZALO_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Chưa cấu hình ZALO_BOT_TOKEN trong file .env" },
        { status: 400 }
      );
    }

    const apiUrl = getZaloApiUrl("deleteWebhook", token);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: "Đã hủy bỏ Webhook thành công! (Có thể sử dụng lại getUpdates)",
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
