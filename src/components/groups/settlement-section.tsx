"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatVND, formatDate, getInitials } from "@/lib/utils/format";
import { ArrowRight, CheckCircle2, Clock, Loader2, QrCode, Copy, Check, Banknote, HelpCircle } from "lucide-react";
import type { DebtEntry } from "@/lib/debt-calculator";

interface Settlement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  isConfirmed: boolean;
  createdAt: string;
  note: string | null;
}

interface Member {
  userId: string;
  user: {
    id: string;
    displayName: string;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    sepayWebhookSecret: string | null;
  };
}

interface SettlementSectionProps {
  debts: DebtEntry[];
  groupId: string;
  currentUserId: string;
  owner: {
    id: string;
    displayName: string;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
  members: Member[];
  settlements: Settlement[];
}

export function SettlementSection({
  debts,
  groupId,
  currentUserId,
  owner,
  members,
  settlements,
}: SettlementSectionProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Đánh dấu không xóa Settlement khi đóng Dialog (nếu đã click Tôi đã chuyển xong hoặc đã thanh toán thành công)
  const keepSettlement = useRef(false);

  // Khoản nợ đang được chọn để thanh toán
  const [activeDebt, setActiveDebt] = useState<DebtEntry | null>(null);

  // Trạng thái hiển thị popup QR thanh toán tự động
  const [activePayment, setActivePayment] = useState<{
    id: string;
    amount: number;
    recipientId: string;
  } | null>(null);

  // Hủy yêu cầu thanh toán (khi tắt popup QR mà chưa thanh toán)
  async function cancelPayment(settlementId: string) {
    try {
      await fetch(`/api/settlements/${settlementId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (err) {
      console.error("Lỗi hủy yêu cầu thanh toán:", err);
    }
  }

  // Tìm thông tin ngân hàng của người thụ hưởng (toUserId)
  const recipientUser = activePayment
    ? members.find((m) => m.userId === activePayment.recipientId)?.user
    : activeDebt
    ? members.find((m) => m.userId === activeDebt.toUserId)?.user
    : null;

  // Kiểm tra xem người nhận có đầy đủ cấu hình SePay hay không
  // (Nếu là owner thì bắt buộc phải có, nếu là thành viên thường thì có thể không có)
  const recipientHasBankInfo = recipientUser?.bankName && recipientUser?.accountNumber && recipientUser?.accountName;

  // Sao chép thông tin thủ công
  const copyText = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. Thanh toán bằng QR chuyển khoản
  async function payWithQR() {
    if (!activeDebt || !recipientUser) return;
    const key = `${activeDebt.fromUserId}-${activeDebt.toUserId}`;
    setLoadingId(key);

    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: activeDebt.fromUserId,
          toUserId: activeDebt.toUserId,
          amount: activeDebt.amount,
          note: `Chuyển khoản QR đến ${recipientUser.displayName}`,
        }),
      });

      const data = await res.json();
      setLoadingId(null);

      if (res.ok && data.id) {
        // Đóng dialog chọn hình thức
        const currentAmount = activeDebt.amount;
        const recipientId = activeDebt.toUserId;
        setActiveDebt(null);
        // Mở popup QR
        setActivePayment({
          id: data.id,
          amount: currentAmount,
          recipientId,
        });
      } else {
        toast.error(data.error || "Không thể tạo yêu cầu thanh toán");
      }
    } catch (err) {
      setLoadingId(null);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  // 2. Thanh toán bằng tiền mặt / chuyển khoản thủ công
  async function payWithCash() {
    if (!activeDebt) return;
    const key = `${activeDebt.fromUserId}-${activeDebt.toUserId}`;
    setLoadingId(key);

    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: activeDebt.fromUserId,
          toUserId: activeDebt.toUserId,
          amount: activeDebt.amount,
          note: "Thanh toán bằng tiền mặt / CK thủ công",
        }),
      });

      setLoadingId(null);
      setActiveDebt(null);

      if (res.ok) {
        toast.success("Đã ghi nhận yêu cầu trả tiền! Vui lòng chờ người nhận xác nhận.");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setLoadingId(null);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  // Poll kiểm tra trạng thái thanh toán từ SePay Webhook
  useEffect(() => {
    if (!activePayment) return;

    const paymentId = activePayment.id;
    let timer: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 100; // ~5 phút

    async function checkStatus() {
      if (attempts >= maxAttempts) {
        setActivePayment(null);
        toast.warning("Hết thời gian chờ thanh toán tự động. Vui lòng liên hệ người nhận để duyệt thủ công.");
        router.refresh();
        return;
      }

      attempts++;
      try {
        const res = await fetch(`/api/settlements/${paymentId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.isConfirmed) {
            keepSettlement.current = true;
            setActivePayment(null);
            toast.success("Thanh toán thành công! Giao dịch của bạn đã được xác nhận tự động. 🎉");
            router.refresh();
            return;
          }
        }
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái:", err);
      }

      // Tiếp tục poll sau 3 giây
      timer = setTimeout(checkStatus, 3000);
    }

    timer = setTimeout(checkStatus, 3000);

    return () => clearTimeout(timer);
  }, [activePayment, router]);

  // Xác nhận nhận tiền thủ công
  async function confirmSettlement(settlementId: string) {
    setLoadingId(settlementId);

    const res = await fetch(`/api/settlements/[id]/confirm`.replace("[id]", settlementId), {
      method: "PATCH",
    });

    setLoadingId(null);

    if (res.ok) {
      toast.success("Đã xác nhận thanh toán!");
      router.refresh();
    } else {
      toast.error("Có lỗi xảy ra");
    }
  }

  // Từ chối yêu cầu thanh toán (chưa nhận được tiền)
  async function rejectSettlement(settlementId: string) {
    setLoadingId(settlementId);

    try {
      const res = await fetch(`/api/settlements/${settlementId}`, {
        method: "DELETE",
      });

      setLoadingId(null);

      if (res.ok) {
        toast.success("Đã từ chối yêu cầu thanh toán!");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setLoadingId(null);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  // Tạo QR URL hướng tới tài khoản người thụ hưởng (recipientUser)
  const qrUrl = activePayment && recipientUser && recipientUser.accountNumber && recipientUser.bankName
    ? `https://vietqr.app/img?acc=${recipientUser.accountNumber}&bank=${recipientUser.bankName}&amount=${activePayment.amount}&des=GS${activePayment.id}`
    : "";

  const transferContent = activePayment ? `GS${activePayment.id}` : "";

  return (
    <div className="space-y-4">
      {/* Pending debts */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Cần thanh toán</h3>
          {debts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Mọi người đã hạch toán sạch! 🎉
              </p>
            </div>
          ) : (
            debts.map((debt) => {
              const isMyDebt = debt.fromUserId === currentUserId;
              const key = `${debt.fromUserId}-${debt.toUserId}`;
              const hasPending = settlements.some(
                (s) =>
                  s.fromUserId === debt.fromUserId &&
                  s.toUserId === debt.toUserId &&
                  !s.isConfirmed
              );
              return (
                <div
                  key={key}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border ${
                    isMyDebt
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(debt.fromUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(debt.toUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {debt.fromUserName} → {debt.toUserName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isMyDebt ? "Bạn cần trả" : "Cần nhận"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Badge
                      variant={isMyDebt ? "destructive" : "default"}
                      className="text-sm px-3 py-1"
                    >
                      {formatVND(debt.amount)}
                    </Badge>
                    {isMyDebt && (
                      hasPending ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="gap-1 font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 opacity-100"
                        >
                          <Clock className="h-3.5 w-3.5 animate-pulse" />
                          Chờ xác nhận
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setActiveDebt(debt)}
                          disabled={loadingId === key}
                          className="gap-1 font-bold text-xs"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                          Trả nợ
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Settlement history */}
      {settlements.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Lịch sử thanh toán</h3>
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1">
                    {s.isConfirmed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{s.fromUserName}</span>
                      {" → "}
                      <span className="font-semibold">{s.toUserName}</span>
                      <span className="text-muted-foreground ml-2 font-mono">
                        {formatVND(s.amount)}
                      </span>
                    </p>
                    {s.note && <p className="text-[10px] text-muted-foreground mt-0.5">{s.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </span>
                  {!s.isConfirmed && s.toUserId === currentUserId && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => confirmSettlement(s.id)}
                        disabled={loadingId === s.id}
                        className="h-7 px-2.5 text-xs gap-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white"
                      >
                        {loadingId === s.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        Đã nhận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectSettlement(s.id)}
                        disabled={loadingId === s.id}
                        className="h-7 px-2.5 text-xs gap-1 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-200"
                      >
                        Chưa nhận được
                      </Button>
                    </div>
                  )}
                  {s.isConfirmed && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Đã xác nhận
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 1. Dialog Lựa chọn hình thức thanh toán */}
      <Dialog open={activeDebt !== null} onOpenChange={(open) => {
        if (!open) setActiveDebt(null);
      }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-center">Xác nhận trả nợ</DialogTitle>
            <DialogDescription className="text-xs text-center">
              Bạn đang trả cho <span className="font-semibold text-foreground">{activeDebt?.toUserName}</span> số tiền{" "}
              <span className="font-bold text-rose-600 dark:text-rose-500 font-mono">{activeDebt ? formatVND(activeDebt.amount) : ""}</span>.
            </DialogDescription>
          </DialogHeader>

          {activeDebt && (
            <div className="space-y-3 pt-2">
              {recipientHasBankInfo ? (
                <Button
                  onClick={payWithQR}
                  className="w-full h-12 flex justify-start gap-3 items-center px-4 font-semibold"
                >
                  <QrCode className="h-5 w-5 text-primary-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Chuyển khoản bằng mã VietQR</p>
                    <p className="text-[10px] opacity-80 font-normal">Quét QR chuyển khoản tự động duyệt nợ</p>
                  </div>
                </Button>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 items-start text-xs text-amber-700 dark:text-amber-500">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Người nhận (**{activeDebt.toUserName}**) chưa cấu hình thông tin tài khoản ngân hàng trong Cài đặt nên không thể tạo mã chuyển khoản VietQR tự động.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={payWithCash}
                className="w-full h-12 flex justify-start gap-3 items-center px-4 border-dashed font-semibold"
              >
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Trả bằng Tiền mặt / CK tay</p>
                  <p className="text-[10px] text-muted-foreground font-normal">Xác nhận đã đưa tiền mặt, người nhận duyệt thủ công</p>
                </div>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Dialog Quét mã VietQR thanh toán tự động */}
      <Dialog open={activePayment !== null} onOpenChange={(open) => {
        if (!open) {
          if (activePayment && !keepSettlement.current) {
            cancelPayment(activePayment.id);
          }
          keepSettlement.current = false;
          setActivePayment(null);
        }
      }}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-lg">Quét QR chuyển khoản</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Mở ứng dụng ngân hàng và quét mã để chuyển khoản chính xác thông tin.
            </DialogDescription>
          </DialogHeader>

          {activePayment && recipientUser && (
            <div className="space-y-4">
              <div className="flex justify-center p-3 border rounded-2xl bg-white max-w-[220px] mx-auto shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="VietQR Code"
                  className="w-full aspect-square"
                />
              </div>

              {/* Thông tin chi tiết */}
              <div className="bg-muted/50 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ngân hàng nhận</span>
                  <div className="flex items-center gap-1 font-semibold">
                    <span>{recipientUser.bankName}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyText(recipientUser.bankName || "", "Ngân hàng")}>
                      {copiedField === "Ngân hàng" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Số tài khoản</span>
                  <div className="flex items-center gap-1 font-semibold font-mono">
                    <span>{recipientUser.accountNumber}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyText(recipientUser.accountNumber || "", "Số tài khoản")}>
                      {copiedField === "Số tài khoản" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chủ tài khoản</span>
                  <span className="font-semibold">{recipientUser.accountName}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Số tiền</span>
                  <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-500">
                    <span>{formatVND(activePayment.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground" onClick={() => copyText(String(activePayment.amount), "Số tiền")}>
                      {copiedField === "Số tiền" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nội dung CK bắt buộc</span>
                  <div className="flex items-center gap-1 font-bold text-primary font-mono">
                    <span>{transferContent}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground" onClick={() => copyText(transferContent, "Nội dung chuyển khoản")}>
                      {copiedField === "Nội dung chuyển khoản" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn tự động / thủ công */}
              {recipientUser.sepayWebhookSecret ? (
                <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-500 font-semibold py-1 bg-amber-500/5 rounded-lg border border-amber-500/10 px-3">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Đang chờ xử lý giao dịch...</span>
                </div>
              ) : (
                <div className="bg-primary/5 rounded-xl border border-primary/10 p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                    ℹ️ Người nhận là thành viên thường (hoặc chưa cấu hình SePay). Giao dịch này sẽ cần người nhận bấm **Xác nhận nhận tiền** thủ công sau khi bạn chuyển khoản thành công.
                  </p>
                  <Button
                    onClick={() => {
                      keepSettlement.current = true;
                      setActivePayment(null);
                      toast.success("Đã ghi nhận yêu cầu! Đang chờ người nhận duyệt thủ công.");
                      router.refresh();
                    }}
                    className="w-full h-10 font-bold"
                  >
                    Tôi đã chuyển tiền xong
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
