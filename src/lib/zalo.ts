import { prisma } from "@/lib/prisma";

/**
 * Lấy URL gọi API của Zalo Bot Platform theo chuẩn https://bot-api.zaloplatforms.com/bot<BOT_TOKEN>/<functionName>
 */
export function getZaloApiUrl(functionName: string, token: string): string {
  if (process.env.ZALO_BOT_API_URL) {
    return process.env.ZALO_BOT_API_URL;
  }
  return `https://bot-api.zaloplatforms.com/bot${token}/${functionName}`;
}

export { generateZaloOtp } from "@/lib/utils/zalo-otp";

/**
 * Gửi tin nhắn Zalo trực tiếp đến một Zalo Chat ID (bất đồng bộ)
 */
export async function sendDirectZaloMessage(chatId: string, messageText: string) {
  const token = process.env.ZALO_BOT_TOKEN;
  if (!token || !chatId?.trim()) return;

  const apiUrl = getZaloApiUrl("sendMessage", token);

  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId.trim(),
      text: messageText,
    }),
  }).catch((err) => {
    console.error("[Zalo Bot Platform] Lỗi gửi tin nhắn Zalo:", err);
  });
}

/**
 * Gửi thông báo Zalo cá nhân đến 1 người dùng dựa vào User ID
 */
export async function sendUserZaloNotification(
  userId: string,
  messageText: string
) {
  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zaloChatId: true },
    });

    if (!user?.zaloChatId?.trim()) return;

    await sendDirectZaloMessage(user.zaloChatId, messageText);
  } catch (err) {
    console.error("[Zalo Bot Platform] Lỗi khi lấy Zalo Chat ID người dùng:", err);
  }
}

/**
 * Gửi thông báo Zalo cá nhân đến nhiều người dùng (Array of User IDs)
 */
export async function sendMultipleUsersZaloNotification(
  userIds: string[],
  messageText: string
) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueIds },
        zaloChatId: { not: null },
      },
      select: { zaloChatId: true },
    });

    for (const u of users) {
      if (u.zaloChatId?.trim()) {
        sendDirectZaloMessage(u.zaloChatId, messageText);
      }
    }
  } catch (err) {
    console.error("[Zalo Bot Platform] Lỗi gửi tin nhắn tới nhiều người dùng:", err);
  }
}

/**
 * Gửi tin nhắn thử nghiệm trực tiếp đến một Zalo Chat ID cá nhân
 */
export async function sendDirectZaloTest(chatId: string, displayName: string) {
  const token = process.env.ZALO_BOT_TOKEN;
  if (!token) {
    throw new Error("Chưa cấu hình ZALO_BOT_TOKEN trong file .env của hệ thống.");
  }

  const apiUrl = getZaloApiUrl("sendMessage", token);

  const message = `🤖 [GroupSplit] Chào ${displayName}! 

🟢 Tài khoản Zalo cá nhân của bạn đã được kết nối thành công. 
Từ giờ, bạn sẽ nhận được thông báo cá nhân trực tiếp tại đây mỗi khi có hóa đơn, nợ mới hoặc thanh toán liên quan đến bạn! 🎉`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new Error(
        data.description || data.message || "Gửi tin nhắn thử nghiệm Zalo thất bại. Vui lòng kiểm tra lại Zalo Chat ID hoặc Bot Token."
      );
    }

    return data;
  } catch (err: any) {
    if (err.cause?.code === "ENOTFOUND" || err.message?.includes("fetch failed")) {
      throw new Error(
        `Không thể kết nối tới Zalo Bot API (${apiUrl}). Vui lòng kiểm tra kết nối mạng hoặc ZALO_BOT_TOKEN trong file .env.`
      );
    }
    throw err;
  }
}
