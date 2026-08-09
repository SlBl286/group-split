"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Copy, Check, Info, Key, Camera, User, ShieldCheck, Crown, Users, CreditCard, QrCode, Zap, Sparkles, AlertTriangle } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { BankSelect } from "@/components/ui/bank-select";
import { SepayWizardDialog } from "@/components/settings/sepay-wizard-dialog";
import { ProfileZaloSettings } from "@/components/settings/profile-zalo-settings";

interface UserSettings {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  zaloChatId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  sepayWebhookSecret: string | null;
}

const POPULAR_BANKS = [
  { value: "Vietcombank", label: "Vietcombank (VCB)" },
  { value: "VietinBank", label: "VietinBank (CTG)" },
  { value: "BIDV", label: "BIDV" },
  { value: "Techcombank", label: "Techcombank (TCB)" },
  { value: "MBBank", label: "MBBank (MB)" },
  { value: "ACB", label: "ACB" },
  { value: "VPBank", label: "VPBank (VPB)" },
  { value: "TPBank", label: "TPBank (TPB)" },
  { value: "Sacombank", label: "Sacombank (STB)" },
  { value: "VIB", label: "VIB" },
  { value: "Agribank", label: "Agribank (VBA)" },
  { value: "SHB", label: "SHB" },
];

export function SettingsForm({ user }: { user: UserSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // States cho thông tin cá nhân & avatar
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // States cho thông tin ngân hàng & sepay
  const [bankName, setBankName] = useState(user.bankName || "");
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || "");
  const [accountName, setAccountName] = useState(user.accountName || "");
  const [sepaySecret, setSepaySecret] = useState(user.sepayWebhookSecret || "");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const isSepayFullyConfigured = Boolean(bankName && accountNumber && accountName && sepaySecret);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const webhookUrl = origin ? `${origin}/api/webhook/sepay/${user.id}` : "";

  // Xử lý đổi file ảnh đại diện (Xem trước client-side và gán file)
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Vui lòng chọn ảnh nhỏ hơn 5MB để tối ưu dung lượng!");
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      toast.success("Đã chọn ảnh đại diện mới!");
    }
  }

  async function copyWebhookUrl() {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Đã copy webhook URL cá nhân!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("displayName", displayName);
    formData.append("bankName", bankName);
    formData.append("accountNumber", accountNumber);
    formData.append("accountName", accountName);
    formData.append("sepayWebhookSecret", sepaySecret || "");
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        body: formData, // Sử dụng FormData cho tải file thật
      });

      setLoading(false);

      if (res.ok) {
        toast.success("Cập nhật thông tin thành công!");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      setLoading(false);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  return (
    <div className="space-y-6">
      {!isSepayFullyConfigured && (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <AlertTitle className="font-semibold text-sm text-amber-800 dark:text-amber-300">
              Tài khoản chưa hoàn tất kết nối SePay Webhook
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn cần điền đầy đủ Thông tin ngân hàng và Webhook Secret Key để có thể làm Trưởng nhóm tạo nhóm chia tiền mới.
            </AlertDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs gap-1.5 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mở Hướng dẫn Từng bước
          </Button>
        </Alert>
      )}

      <Card className="border">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4" />
            Quy định & Hướng dẫn thanh toán
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Chi tiết vai trò và yêu cầu cài đặt thông tin nhận tiền cho từng loại tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Trưởng nhóm */}
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
              <Crown className="h-4 w-4 shrink-0" />
              <span>Trưởng nhóm (Owner)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Bắt buộc cấu hình đầy đủ <strong className="text-foreground font-semibold">Thông tin ngân hàng</strong> và <strong className="text-foreground font-semibold">SePay Webhook Secret</strong> để được tạo nhóm. Hệ thống tự động sinh mã VietQR chuẩn và tự động gạch nợ thông qua SePay khi nhận khoản thanh toán.
            </p>
          </div>

          {/* Thành viên */}
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
              <Users className="h-4 w-4 shrink-0" />
              <span>Thành viên nhóm</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Chỉ cần cập nhật <strong className="text-foreground font-semibold">Ngân hàng & Số tài khoản</strong>. Thông tin này dùng để hiển thị cho Trưởng nhóm hoặc thành viên khác quét mã QR hoặc sao chép khi chuyển khoản trả tiền dư nợ cho bạn.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Details & Avatar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription className="text-xs">
              Cập nhật ảnh đại diện và tên hiển thị của bạn trong nhóm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar upload wrapper */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={avatarPreview || undefined} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-muted text-foreground text-xl">
                    {getInitials(displayName || "U")}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold gap-1"
                >
                  <Camera className="h-4 w-4" />
                  Thay đổi
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left space-y-1.5 flex-1 w-full">
                <Label htmlFor="display-name" className="text-sm font-semibold">Tên hiển thị của bạn *</Label>
                <Input
                  id="display-name"
                  placeholder="Nhập tên hiển thị..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-11 font-medium"
                />
                <p className="text-[10px] text-muted-foreground">
                  Hỗ trợ tải lên ảnh đuôi .png, .jpg, .webp dung lượng dưới 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zalo Personal Notification Settings */}
        <ProfileZaloSettings user={user} />

        {/* Bank Information */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Thông tin nhận tiền & Ngân hàng
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Thông tin ngân hàng thụ hưởng hiển thị khi thành viên chuyển khoản hoặc tạo mã VietQR tự động.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Ngân hàng thụ hưởng *</Label>
              <BankSelect value={bankName} onChange={setBankName} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-sm font-semibold">Số tài khoản *</Label>
                <Input
                  id="account-number"
                  placeholder="VD: 1903456789..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ""))}
                  required
                  className="h-11 font-mono tracking-wider text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-name" className="text-sm font-semibold">Tên chủ tài khoản (Không dấu) *</Label>
                <Input
                  id="account-name"
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  required
                  className="h-11 font-semibold uppercase tracking-wide"
                />
              </div>
            </div>

            {/* Live VietQR Card & QR Code Preview */}
            {bankName && accountNumber && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-lg border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Thông tin thẻ */}
                  <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ngân hàng thụ hưởng</p>
                      <p className="text-sm font-bold text-emerald-400">{bankName}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Số tài khoản</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xl font-mono font-black tracking-wider text-white">
                          {accountNumber}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(accountNumber);
                            toast.success("Đã sao chép số tài khoản!");
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Sao chép STK"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Chủ tài khoản</p>
                      <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        {accountName || "CHỦ TÀI KHOẢN"}
                      </p>
                    </div>
                  </div>

                  {/* Mã VietQR thực tế */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 bg-white/5 p-3 rounded-xl border border-white/10">
                    <img
                      src={`https://img.vietqr.io/image/${encodeURIComponent(bankName)}-${encodeURIComponent(accountNumber)}-compact2.png?accountName=${encodeURIComponent(accountName || "")}`}
                      alt="Mã VietQR cá nhân"
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-lg bg-white p-1.5 shadow-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1 mt-1">
                      <QrCode className="h-3 w-3 text-emerald-400" />
                      Quét thử bằng App Bank
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SePay Integration */}
        <Card className="border">
          <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Key className="h-4 w-4 text-primary" />
                Tích hợp SePay Webhook (Dành cho Trưởng nhóm)
              </CardTitle>
              <CardDescription className="text-xs">
                Cấu hình webhook tự động gạch nợ qua SePay (Miễn phí).
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWizardOpen(true)}
              className="font-medium text-xs gap-1.5 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Xem Hướng dẫn 4 bước
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">1. Đường dẫn Webhook URL cá nhân</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl || "Đang tải..."}
                  readOnly
                  className="text-xs font-mono bg-muted select-all h-11"
                />
                <Button
                  type="button"
                  onClick={copyWebhookUrl}
                  disabled={!webhookUrl}
                  variant="outline"
                  className="h-11 px-3 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Sao chép link này và dán vào phần <strong className="text-foreground font-semibold">URL webhook</strong> trong trang cấu hình webhook của SePay (lựa chọn phương thức xác thực <strong className="text-foreground font-semibold">HMAC-SHA256</strong>).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sepay-secret" className="text-sm font-semibold">
                2. Webhook Secret Key
              </Label>
              <Input
                id="sepay-secret"
                type="password"
                placeholder="Nhập Secret Key từ SePay..."
                value={sepaySecret}
                onChange={(e) => setSepaySecret(e.target.value.trim())}
                className="h-11 font-mono"
              />
              <p className="text-xs text-muted-foreground leading-normal">
                Khóa bí mật dùng để xác thực dữ liệu webhook được gửi bảo mật từ SePay.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                variant="secondary"
                className="w-full h-10 font-semibold text-xs sm:text-sm gap-2"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Mở Hướng dẫn Tích hợp Chi tiết (Từng bước)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full h-11 text-base font-bold" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu thay đổi...
            </>
          ) : (
            "Lưu cài đặt"
          )}
        </Button>
      </form>

      {/* Sepay Setup Wizard Modal */}
      <SepayWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        webhookUrl={webhookUrl}
        bankName={bankName}
        accountNumber={accountNumber}
        accountName={accountName}
        sepaySecret={sepaySecret}
        onUpdateBankName={setBankName}
        onUpdateAccountNumber={setAccountNumber}
        onUpdateAccountName={setAccountName}
        onUpdateSepaySecret={setSepaySecret}
        onSave={async () => {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          await handleSubmit(fakeEvent);
        }}
        loading={loading}
      />
    </div>
  );
}
