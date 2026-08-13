import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "groupsplit_captcha_secret_key_2026";

export interface CaptchaData {
  id: string;
  question: string;
  hash: string;
}

/**
 * Sinh phép toán ngẫu nhiên (VD: "7 + 5") và tạo mã băm hash HMAC để xác thực
 */
export function generateCaptcha(): CaptchaData {
  const num1 = Math.floor(Math.random() * 15) + 1;
  const num2 = Math.floor(Math.random() * 15) + 1;
  const answer = num1 + num2;

  const id = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();
  const rawPayload = `${id}:${answer}:${timestamp}`;

  const hash = crypto
    .createHmac("sha256", SECRET)
    .update(rawPayload)
    .digest("hex") + `.${timestamp}`;

  return {
    id,
    question: `${num1} + ${num2} = ?`,
    hash,
  };
}

/**
 * Kiểm tra câu trả lời CAPTCHA từ phía client gửi lên
 */
export function verifyCaptcha(
  id: string,
  userAnswer: string,
  hash: string
): boolean {
  if (!id || !userAnswer || !hash || !hash.includes(".")) return false;

  const [expectedHash, timestampStr] = hash.split(".");
  const timestamp = Number(timestampStr);

  // Hết hạn CAPTCHA sau 5 phút
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    return false;
  }

  const rawPayload = `${id}:${userAnswer.trim()}:${timestamp}`;
  const computedHash = crypto
    .createHmac("sha256", SECRET)
    .update(rawPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(expectedHash)
  );
}
