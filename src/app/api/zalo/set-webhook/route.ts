import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getZaloBotInstance, getZaloApiUrl } from "@/lib/zalo";

// 1. GET: Lấy thông tin Webhook hiện tại (getWebhookInfo / getWebHookInfo)
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bot = getZaloBotInstance();
    if (!bot) {
      return NextResponse.json(
        { error: "Chưa cấu hình ZALO_BOT_TOKEN trong file .env" },
        { status: 400 }
      );
    }

    let data;
    try {
      data = await bot.getWebHookInfo();
    } catch {
      const token = process.env.ZALO_BOT_TOKEN!;
      const res = await fetch(getZaloApiUrl("getWebhookInfo", token), { method: "POST" });
      data = await res.json().catch(() => ({}));
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Đăng ký Webhook URL (setWebhook / setWebHook)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bot = getZaloBotInstance();
    if (!bot) {
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

    // secret_token bắt buộc từ 8 tới 256 ký tự theo tài liệu Zalo Bot API
    const secret =
      secretToken && secretToken.trim().length >= 8
        ? secretToken.trim()
        : process.env.ZALO_BOT_SECRET_TOKEN && process.env.ZALO_BOT_SECRET_TOKEN.trim().length >= 8
        ? process.env.ZALO_BOT_SECRET_TOKEN.trim()
        : "9a48f76378e9b6a12df387ef98acdebf9a48f76378e9b6a12df387ef98acdebf";

    let data;
    try {
      data = await bot.setWebHook(webhookUrl.trim(), secret);
    } catch {
      const token = process.env.ZALO_BOT_TOKEN!;
      const res = await fetch(getZaloApiUrl("setWebhook", token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim(), secret_token: secret }),
      });
      data = await res.json().catch(() => ({}));
    }

    return NextResponse.json({
      success: true,
      message: "Đã đăng ký Webhook thành công với Zalo Bot Platform (node-zalo-bot SDK)!",
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

// 3. DELETE: Hủy bỏ Webhook (deleteWebhook / deleteWebHook)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bot = getZaloBotInstance();
    if (!bot) {
      return NextResponse.json(
        { error: "Chưa cấu hình ZALO_BOT_TOKEN trong file .env" },
        { status: 400 }
      );
    }

    let data;
    try {
      data = await bot.deleteWebHook();
    } catch {
      const token = process.env.ZALO_BOT_TOKEN!;
      const res = await fetch(getZaloApiUrl("deleteWebhook", token), { method: "POST" });
      data = await res.json().catch(() => ({}));
    }

    return NextResponse.json({
      success: true,
      message: "Đã hủy bỏ Webhook thành công! (Có thể sử dụng lại getUpdates / Polling)",
      data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
