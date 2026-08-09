/**
 * Sinh mã OTP 6 số duy nhất và cố định dựa theo User ID để liên kết Zalo cá nhân
 * Pure utility function (no Node.js or Prisma dependencies) for client & server use.
 */
export function generateZaloOtp(userId: string): string {
  if (!userId) return "100000";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash % 900000) + 100000;
  return String(code);
}
