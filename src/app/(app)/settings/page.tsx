import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = {
  title: "Cài đặt tài khoản - GroupSplit",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: {
      id: true,
      displayName: true,
      avatar: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
      sepayWebhookSecret: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground text-sm">
          Cập nhật thông tin thanh toán ngân hàng và tích hợp SePay Webhook tự động.
        </p>
      </div>

      <SettingsForm user={user} />
    </div>
  );
}
