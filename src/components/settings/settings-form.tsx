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
import { Loader2, Copy, Check, Info, Key, Camera, User } from "lucide-react";
import { getInitials } from "@/lib/utils/format";

interface UserSettings {
  id: string;
  displayName: string;
  avatar: string | null;
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
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm font-semibold">Quy định thanh toán</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
          - **Trưởng nhóm (Owner)**: Bắt buộc cấu hình đầy đủ thông tin ngân hàng và **SePay Webhook Secret** để được tạo nhóm. Hệ thống sẽ sinh mã QR VietQR tự động khớp nội dung để gạch nợ tự động thông qua SePay.<br />
          - **Thành viên**: Chỉ cần điền thông tin ngân hàng để Trưởng nhóm copy khi chuyển khoản trả tiền dư nợ.
        </AlertDescription>
      </Alert>

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
                  Hỗ trợ tải lên ảnh đuôi .png, .jpg, .webp dung lượng dưới 5MB. Ảnh sẽ được ghi vào thư mục static phục vụ lưu trữ file thật.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Thông tin ngân hàng</CardTitle>
            <CardDescription className="text-xs">
              Thông tin nhận tiền chuyển khoản (hiển thị cho mọi người quét QR hoặc copy).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-select">Ngân hàng thụ hưởng *</Label>
              <Select value={bankName} onValueChange={(val) => setBankName(val || "")}>
                <SelectTrigger id="bank-select" className="h-11">
                  <SelectValue placeholder="Chọn ngân hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_BANKS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account-number">Số tài khoản *</Label>
                <Input
                  id="account-number"
                  placeholder="Nhập số tài khoản..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ""))}
                  required
                  className="h-11 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-name">Tên chủ tài khoản (Không dấu) *</Label>
                <Input
                  id="account-name"
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  required
                  className="h-11 font-medium"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SePay Integration */}
        <Card className="border-amber-500/20 bg-amber-500/[0.01]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <Key className="h-4 w-4" />
              Tích hợp SePay Webhook (Dành cho Trưởng nhóm)
            </CardTitle>
            <CardDescription className="text-xs">
              Cấu hình webhook tự động gạch nợ qua SePay (Miễn phí).
            </CardDescription>
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
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Sao chép link này và dán vào phần **URL webhook** trong trang cấu hình webhook của SePay (lựa chọn phương thức xác thực **HMAC-SHA256**).
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
    </div>
  );
}
