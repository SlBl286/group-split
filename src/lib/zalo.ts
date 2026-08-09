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
  if (!token || !chatId?.trim()) {
    console.error("[Zalo Bot Platform] Missing token or chatId:", { token: !!token, chatId });
    return null;
  }

  const apiUrl = getZaloApiUrl("sendMessage", token);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId).trim(),
        text: messageText,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      console.error("[Zalo Bot Platform] Send Message Error:", data);
    } else {
      console.log("[Zalo Bot Platform] Send Message Success:", data);
    }
    return data;
  } catch (err) {
    console.error("[Zalo Bot Platform] Lỗi gửi tin nhắn Zalo:", err);
    return null;
  }
}

/**
 * Hàm gửi tin nhắn Zalo thử nghiệm
 */
export async function sendDirectZaloTest(chatId: string, groupName?: string) {
  const targetName = groupName ? `cho nhóm "${groupName}"` : "";
  const testMessage = `🟢 [GroupSplit] Đây là tin nhắn Zalo thử nghiệm ${targetName}!
  
Zalo Chat ID (${chatId}) đã được kết nối và hoạt động hoàn hảo 🎉`;
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
    console.error("[Zalo Bot Platform] Lỗi khi gửi thông báo nhiều người dùng:", err);
  }
}
