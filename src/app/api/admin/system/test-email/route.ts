import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.username !== "qy286" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Quyền truy cập bị từ chối" }, { status: 403 });
  }

  try {
    const { toEmail } = await req.json();

    if (!toEmail) {
      return NextResponse.json({ error: "Vui lòng nhập Email người nhận thử nghiệm" }, { status: 400 });
    }

    const result = await sendEmail({
      to: toEmail.trim(),
      subject: "🧪 [GroupSplit Admin] Email kiểm tra cấu hình SMTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">GroupSplit Admin SMTP Test</h2>
          <p>Chúc mừng! Cấu hình máy chủ SMTP của bạn đang hoạt động chính xác.</p>
          <p style="color: #64748b; font-size: 12px;">Thời gian gửi: ${new Date().toLocaleString("vi-VN")}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Đã gửi thành công Email thử nghiệm đến ${toEmail}!`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
