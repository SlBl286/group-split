import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getZaloApiUrl } from "@/lib/zalo";

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
    const secret = secretToken || process.env.ZALO_BOT_SECRET_TOKEN || "";

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
