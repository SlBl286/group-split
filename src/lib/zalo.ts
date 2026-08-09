import { prisma } from "@/lib/prisma";

export { generateZaloOtp } from "@/lib/utils/zalo-otp";

/**
 * Lấy URL gọi API của Zalo Bot Platform theo chuẩn
 */
export function getZaloApiUrl(functionName: string, token: string): string {
  if (process.env.ZALO_BOT_API_URL) {
    return process.env.ZALO_BOT_API_URL;
  }
  return `https://bot-api.zaloplatforms.com/bot${token}/${functionName}`;
}

/**
 * Trả về instance của node-zalo-bot SDK chính thức (sử dụng eval require để nạp an toàn cho Turbopack)
 */
export function getZaloBotInstance() {
  const token = process.env.ZALO_BOT_TOKEN;
  if (!token) return null;
  try {
    // Dynamic require để Turbopack không phân tích các hàm require động bên trong package node-zalo-bot
    const ZaloBotClass = eval('require')("node-zalo-bot");
    const ZaloBot = ZaloBotClass.default || ZaloBotClass;
    return new ZaloBot(token);
  } catch (err) {
    console.warn("[node-zalo-bot] Could not load node-zalo-bot SDK:", err);
    return null;
  }
}

/**
 * Gửi tin nhắn Zalo trực tiếp đến một Zalo Chat ID bằng node-zalo-bot SDK chính thức
 */
export async function sendDirectZaloMessage(chatId: string, messageText: string) {
  const token = process.env.ZALO_BOT_TOKEN;
  if (!token || !chatId?.trim()) {
    console.error("[node-zalo-bot] Missing token or chatId:", { token: !!token, chatId });
    return null;
  }

  const bot = getZaloBotInstance();
  if (bot && typeof bot.sendMessage === "function") {
    try {
      const result = await bot.sendMessage(String(chatId).trim(), messageText);
      console.log("[node-zalo-bot] Send Message Success:", result);
      return result;
    } catch (err: any) {
      console.error("[node-zalo-bot] Lỗi gửi tin nhắn Zalo SDK, chuyển sang fetch fallback:", err);
    }
  }

  return fetchDirectFallback(token, chatId, messageText);
}

async function fetchDirectFallback(token: string, chatId: string, messageText: string) {
  try {
    const apiUrl = getZaloApiUrl("sendMessage", token);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId).trim(),
        text: messageText,
      }),
    });
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.error("[Zalo Fallback Error]:", err);
    return null;
  }
}

/**
 * Hàm gửi tin nhắn Zalo thử nghiệm
 */
export async function sendDirectZaloTest(chatId: string, groupName?: string) {
  const targetName = groupName ? `cho nhóm "${groupName}"` : "";
  const testMessage = `🟢 [GroupSplit] Đây là tin nhắn Zalo thử nghiệm ${targetName}!
  
Zalo Chat ID (${chatId}) đã được kết nối thành công qua node-zalo-bot SDK! 🎉`;
  return sendDirectZaloMessage(chatId, testMessage);
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
    console.error("[node-zalo-bot] Lỗi khi lấy Zalo Chat ID người dùng:", err);
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
      where: { id: { in: uniqueIds } },
      select: { zaloChatId: true },
    });

    const validChatIds = users
      .map((u) => u.zaloChatId?.trim())
      .filter((id): id is string => !!id);

    for (const chatId of validChatIds) {
      await sendDirectZaloMessage(chatId, messageText);
    }
  } catch (err) {
    console.error("[node-zalo-bot] Lỗi khi gửi thông báo nhiều người dùng:", err);
  }
}
