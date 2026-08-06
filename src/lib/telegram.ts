import { prisma } from "@/lib/prisma";

/**
 * Gửi thông báo đến Telegram Chat ID đã cấu hình của nhóm (bất đồng bộ)
 */
export async function sendGroupTelegramNotification(
  groupId: string,
  htmlMessage: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { telegramChatId: true },
    });

    if (!group?.telegramChatId?.trim()) return;

    // Gửi bất đồng bộ (fire-and-forget) không làm nghẽn luồng API chính
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: group.telegramChatId.trim(),
        text: htmlMessage,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }).catch((err) => {
      console.error("[Telegram Bot] Lỗi gửi tin nhắn:", err);
    });
  } catch (err) {
    console.error("[Telegram Bot] Lỗi khi truy vấn nhóm:", err);
  }
}

/**
 * Gửi tin nhắn thử nghiệm trực tiếp đến một Telegram Chat ID cụ thể
 */
export async function sendDirectTelegramTest(chatId: string, groupName: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env của hệ thống.");
  }

  const message = `🤖 <b>[GroupSplit Test]</b> Kết nối thành công!

Nhóm: <b>${groupName}</b>
Trạng thái: 🟢 Đã liên kết Telegram Bot thành công. Từ giờ các hoạt động hóa đơn, trả nợ, duyệt tiền trong nhóm sẽ tự động được gửi tới đây! 🎉`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId.trim(),
      text: message,
      parse_mode: "HTML",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.description || "Gửi tin nhắn thử nghiệm thất bại. Vui lòng kiểm tra lại Chat ID hoặc đảm bảo đã thêm Bot vào nhóm.");
  }

  return data;
}
