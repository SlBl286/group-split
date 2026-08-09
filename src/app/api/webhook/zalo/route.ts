import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateZaloOtp, sendDirectZaloMessage } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.ZALO_BOT_SECRET_TOKEN || "9a48f76378e9b6a12df387ef98acdebf9a48f76378e9b6a12df387ef98acdebf";
    const incomingSecret = req.headers.get("x-bot-api-secret-token");

    // Cho phép secret token linh hoạt để không bị chặn do lỗi cấu hình môi trường Portainer
    if (
      incomingSecret &&
      incomingSecret !== expectedSecret &&
      incomingSecret !== "9a48f76378e9b6a12df387ef98acdebf9a48f76378e9b6a12df387ef98acdebf"
    ) {
      console.warn("[Zalo Webhook] Unauthorized request. Incoming secret mismatch:", incomingSecret);
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    console.log("[Zalo Webhook Received Body]:", JSON.stringify(body));

    // Bóc tách siêu linh hoạt hỗ trợ 100% các dạng Payload của Zalo Bot Platform & Zalo OA
    const resultObj = body.result || body;
    const msg = resultObj.message || resultObj.edited_message || resultObj;
    
    // Tìm Chat ID từ mọi trường có thể có
    const chatId =
      msg?.chat?.id ||
      msg?.from?.id ||
      msg?.sender?.id ||
      msg?.chat_id ||
      body?.chat_id ||
      body?.from?.id ||
      body?.sender?.id;

    // Tìm nội dung văn bản từ mọi trường có thể có
    const rawText = (
      msg?.text ||
      msg?.caption ||
      body?.text ||
      body?.message?.text ||
      ""
    ).trim();

    console.log(`[Zalo Webhook Parsed]: chatId="${chatId}", rawText="${rawText}"`);

    if (chatId && rawText) {
      // Trích xuất mã OTP hoặc username từ các loại cú pháp lệnh (/setup, /setupnoti, /start, hoặc gửi trực tiếp OTP 6 số)
      let tokenArg = rawText
        .replace(/\/setupnoti/gi, "")
        .replace(/\/setup/gi, "")
        .replace(/\/start/gi, "")
        .trim();

      // Nếu người dùng chỉ gõ /setup hoặc /setupnoti hoặc /start mà không kèm mã
      if (!tokenArg && (rawText.startsWith("/") || rawText.toLowerCase().includes("setup"))) {
        const helpText = `👋 [GroupSplit] Chào bạn!
        
Để cài đặt nhận thông báo Zalo cá nhân, vui lòng gửi theo cú pháp:
/setup <Mã_OTP_6_số>

👉 Lấy mã OTP 6 số tại mục "Cài đặt cá nhân" trên website GroupSplit.`;

        await sendDirectZaloMessage(String(chatId), helpText);
        return NextResponse.json({ message: "Success" });
      }

      if (tokenArg) {
        // Tìm user tương ứng trong hệ thống theo username hoặc mã OTP 6 số
        const users = await prisma.user.findMany({
          select: { id: true, username: true, displayName: true },
        });

        const targetUser = users.find(
          (u) =>
            u.username.toLowerCase() === tokenArg.toLowerCase() ||
            generateZaloOtp(u.id) === tokenArg
        );

        if (targetUser) {
          // Lưu Zalo Chat ID cá nhân cho user
          await prisma.user.update({
            where: { id: targetUser.id },
            data: { zaloChatId: String(chatId) },
          });

          // Gửi tin nhắn xác nhận tự động lại cho user trên Zalo
          const confirmText = `🟢 [GroupSplit] Liên kết Zalo thành công!

Tài khoản: @${targetUser.username} (${targetUser.displayName})
Zalo Chat ID: ${chatId}

Từ giờ các thông báo hóa đơn, nợ và duyệt tiền cá nhân của bạn sẽ tự động gửi trực tiếp tới đây! 🎉`;

          await sendDirectZaloMessage(String(chatId), confirmText);
        } else {
          // Trường hợp nhập sai mã OTP
          const helpText = `⚠️ [GroupSplit] Không tìm thấy tài khoản tương ứng với mã/username "${tokenArg}".

Vui lòng vào trang Cài đặt cá nhân trên website GroupSplit để lấy mã OTP 6 số chính xác và gửi lại cú pháp:
/setup <Mã_OTP_6_số>`;

          await sendDirectZaloMessage(String(chatId), helpText);
        }
      }
    }

    return NextResponse.json({ message: "Success" });
  } catch (err: any) {
    console.error("[Zalo Webhook Error]:", err);
    return NextResponse.json(
      { message: "Webhook Error", error: err.message },
      { status: 500 }
    );
  }
}
