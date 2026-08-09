import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateZaloOtp, sendDirectZaloMessage } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.ZALO_BOT_SECRET_TOKEN;
    const incomingSecret = req.headers.get("x-bot-api-secret-token");

    if (expectedSecret && incomingSecret !== expectedSecret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    console.log("[Zalo Webhook Received]:", JSON.stringify(body));

    // Lấy thông tin tin nhắn từ Webhook payload (Zalo Bot Platform format)
    const resultObj = body.result || body;
    const msg = resultObj.message || resultObj.edited_message || resultObj;
    const chatId = msg?.chat?.id || msg?.from?.id || msg?.chat_id;
    const rawText = (msg?.text || msg?.caption || "").trim();

    if (chatId && rawText) {
      // Trích xuất mã OTP hoặc username từ câu lệnh (/setupnoti 839201 hoặc /setupnoti username)
      let tokenArg = rawText;

      if (rawText.toLowerCase().includes("/setupnoti")) {
        tokenArg = rawText.replace(/\/setupnoti/gi, "").trim();
      } else if (rawText.toLowerCase().includes("/start")) {
        tokenArg = rawText.replace(/\/start/gi, "").trim();
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

          sendDirectZaloMessage(String(chatId), confirmText);
        } else {
          // Trường hợp nhập sai mã OTP
          const helpText = `⚠️ [GroupSplit] Không tìm thấy tài khoản tương ứng với mã/username "${tokenArg}".

Vui lòng vào trang Hồ sơ cá nhân trên website GroupSplit để lấy mã OTP 6 số chính xác và gửi lại cú pháp:
/setupnoti <Mã_OTP_6_số>`;

          sendDirectZaloMessage(String(chatId), helpText);
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
