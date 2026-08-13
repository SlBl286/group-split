import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Lấy cấu hình SMTP từ bảng SystemSetting trong DB hoặc môi trường env
 */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "SMTP_HOST",
            "SMTP_PORT",
            "SMTP_USER",
            "SMTP_PASS",
            "SMTP_FROM",
            "SMTP_SECURE",
          ],
        },
      },
    });

    const map = new Map<string, string>(
      settings.map((s: { key: string; value: string }) => [s.key, s.value])
    );

    const host = map.get("SMTP_HOST") || process.env.SMTP_HOST || "";
    const port = Number(map.get("SMTP_PORT") || process.env.SMTP_PORT || 587);
    const user = map.get("SMTP_USER") || process.env.SMTP_USER || "";
    const pass = map.get("SMTP_PASS") || process.env.SMTP_PASS || "";
    const from =
      map.get("SMTP_FROM") ||
      process.env.SMTP_FROM ||
      user ||
      "no-reply@groupsplit.local";
    const secure =
      map.get("SMTP_SECURE") === "true" || process.env.SMTP_SECURE === "true";

    if (!host || !user) return null;

    return { host, port, secure, user, pass, from };
  } catch (err) {
    console.error("Error reading SMTP config:", err);
    return null;
  }
}

/**
 * Gửi email bằng nodemailer
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const config = await getSmtpConfig();

  if (!config) {
    console.log(
      `[Email Service Notice] SMTP chưa được cấu hình. Chi tiết Email gửi tới [${to}]:`
    );
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text || html}`);
    return { success: true, mode: "simulated" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html,
    });

    console.log("[Email Service] Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId, mode: "smtp" };
  } catch (err: any) {
    console.error("[Email Service Error]:", err);
    throw new Error(err.message || "Không thể gửi email qua máy chủ SMTP");
  }
}

/**
 * Gửi email chứa mã OTP xác thực Email khi Đăng ký
 */
export async function sendVerificationEmail(
  toEmail: string,
  otpCode: string,
  username: string
) {
  const subject = `🟢 [GroupSplit] Mã OTP xác thực tài khoản Email`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <h2 style="color: #2563eb; text-align: center;">GroupSplit - Xác thực Email</h2>
      <p>Xin chào <strong>@${username}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại GroupSplit. Vui lòng nhập mã OTP dưới đây để xác thực địa chỉ email của bạn:</p>
      <div style="text-align: center; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #2563eb; background: #eff6ff; padding: 10px 25px; border-radius: 8px; border: 1px solid #bfdbfe;">
          ${otpCode}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px;">Mã OTP có hiệu lực trong 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Gửi email chứa mã OTP Khôi phục Mật khẩu
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  otpCode: string,
  username: string
) {
  const subject = `🔑 [GroupSplit] Mã OTP khôi phục mật khẩu`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <h2 style="color: #dc2626; text-align: center;">GroupSplit - Khôi phục Mật khẩu</h2>
      <p>Xin chào <strong>@${username}</strong>,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản GroupSplit của mình. Vui lòng sử dụng mã OTP dưới đây để hoàn tất:</p>
      <div style="text-align: center; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #dc2626; background: #fef2f2; padding: 10px 25px; border-radius: 8px; border: 1px solid #fecaca;">
          ${otpCode}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px;">Mã OTP có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}
