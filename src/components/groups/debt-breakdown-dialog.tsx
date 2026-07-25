"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatVND, formatDate } from "@/lib/utils/format";
import { Receipt, CreditCard, ArrowRightLeft, Calculator, FileText, CheckCircle2, User, Coins, Clock } from "lucide-react";
import type { DebtEntry } from "@/lib/debt-calculator";

interface DebtBreakdownDialogProps {
  debt: DebtEntry | null;
  onClose: () => void;
  expenses?: Array<{
    id: string;
    title: string;
    amount: number;
    paidById: string;
    date: string;
    splits: Array<{
      userId: string;
      amount: number;
    }>;
    category?: string;
  }>;
  settlements?: Array<{
    id: string;
    fromUserId: string;
    fromUserName?: string;
    toUserId: string;
    toUserName?: string;
    amount: number;
    isConfirmed: boolean;
    createdAt: string;
    note?: string | null;
  }>;
  fundAllocations?: Array<{
    id: string;
    amount: number;
    note?: string | null;
    date: string;
    fromUserId: string;
    fromUserName?: string;
    toUserId: string;
    toUserName?: string;
  }>;
}

export function DebtBreakdownDialog({
  debt,
  onClose,
  expenses = [],
  settlements = [],
  fundAllocations = [],
}: DebtBreakdownDialogProps) {
  const [activeTab, setActiveTab] = useState<"PAYER" | "RECEIVER">("PAYER");
  const [showAllHistory, setShowAllHistory] = useState(false);

  if (!debt) return null;

  const { fromUserId, fromUserName, toUserId, toUserName, amount } = debt;

  // Tìm lần thanh toán gần nhất giữa 2 bên (từ 2 phía đã xác nhận)
  const pairConfirmedSettlements = settlements
    .filter(
      (s) =>
        s.isConfirmed &&
        ((s.fromUserId === fromUserId && s.toUserId === toUserId) ||
          (s.fromUserId === toUserId && s.toUserId === fromUserId))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lastSettlement = pairConfirmedSettlements[0] || null;
  const lastSettlementTime = lastSettlement ? new Date(lastSettlement.createdAt).getTime() : 0;

  // Lọc dữ liệu: Nếu showAllHistory = false, chỉ lấy các phát sinh TỪ SAU lần thanh toán gần nhất
  const activeExpenses = expenses.filter(
    (exp) =>
      showAllHistory ||
      lastSettlementTime === 0 ||
      new Date(exp.date).getTime() > lastSettlementTime
  );

  const activeFundAllocations = fundAllocations.filter(
    (fa) =>
      showAllHistory ||
      lastSettlementTime === 0 ||
      new Date(fa.date).getTime() > lastSettlementTime
  );

  const activeSettlements = settlements.filter(
    (s) =>
      showAllHistory ||
      lastSettlementTime === 0 ||
      new Date(s.createdAt).getTime() > lastSettlementTime
  );

  // Selected user based on tab
  const isPayerTab = activeTab === "PAYER";
  const targetUserId = isPayerTab ? fromUserId : toUserId;
  const targetUserName = isPayerTab ? fromUserName : toUserName;

  // 1. Hóa đơn mà người này (targetUserId) được chia tiền phải trả
  const consumedSplits = activeExpenses
    .flatMap((exp) =>
      exp.splits
        .filter((s) => s.userId === targetUserId && s.amount > 0)
        .map((s) => ({
          expenseId: exp.id,
          title: exp.title,
          date: exp.date,
          category: exp.category,
          totalExpenseAmount: exp.amount,
          splitAmount: s.amount,
          paidById: exp.paidById,
        }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalConsumed = consumedSplits.reduce((sum, item) => sum + item.splitAmount, 0);

  // 2. Hóa đơn mà người này (targetUserId) đứng ra tự trả tiền trước cho cả nhóm
  const upfrontPaidExpenses = activeExpenses
    .filter((exp) => exp.paidById === targetUserId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalUpfrontPaid = upfrontPaidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 3. Các khoản cấp tiền từ Quỹ nhóm (fundAllocations) liên quan tới targetUserId
  const relevantFundAllocations = activeFundAllocations.filter(
    (fa) => fa.fromUserId === targetUserId || fa.toUserId === targetUserId
  );

  const totalFundReceived = relevantFundAllocations
    .filter((fa) => fa.toUserId === targetUserId)
    .reduce((sum, fa) => sum + fa.amount, 0);

  const totalFundGiven = relevantFundAllocations
    .filter((fa) => fa.fromUserId === targetUserId)
    .reduce((sum, fa) => sum + fa.amount, 0);

  const netFundAdjustment = totalFundReceived - totalFundGiven;

  // 4. Các khoản thanh toán (settlements) đã xác nhận liên quan tới targetUserId
  const confirmedSettlements = activeSettlements.filter(
    (s) => s.isConfirmed && (s.fromUserId === targetUserId || s.toUserId === targetUserId)
  );

  const totalPaidSettlements = confirmedSettlements
    .filter((s) => s.fromUserId === targetUserId)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalReceivedSettlements = confirmedSettlements
    .filter((s) => s.toUserId === targetUserId)
    .reduce((sum, s) => sum + s.amount, 0);

  const netSettlementAdjustment = totalPaidSettlements - totalReceivedSettlements;

  // Tính toán số dư ròng chuẩn tuyệt đối: B = (+ totalUpfrontPaid) - (totalConsumed) + (netFundAdjustment) + (netSettlementAdjustment)
  const calculatedNetBalance = totalUpfrontPaid - totalConsumed + netFundAdjustment + netSettlementAdjustment;
  const finalDisplayAmount = Math.abs(calculatedNetBalance) > 0 ? Math.abs(calculatedNetBalance) : amount;

  return (
    <Dialog open={!!debt} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" />
            Bảng kê chi tiết hạch toán dư nợ
          </div>
          <DialogTitle className="text-lg font-bold flex items-center justify-between gap-2">
            <span>
              {fromUserName} <span className="text-muted-foreground font-normal">➔</span> {toUserName}
            </span>
            <Badge variant="destructive" className="text-sm font-extrabold px-3 py-1 shrink-0">
              {formatVND(finalDisplayAmount)}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Chi tiết các khoản phát sinh dư nợ chưa thanh toán.
          </DialogDescription>

          {/* Alert / Filter Status Bar */}
          <div className="flex items-center justify-between bg-card border p-2 px-3 rounded-lg text-xs mt-3">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              {!showAllHistory && lastSettlement ? (
                <span>
                  Phát sinh từ lần thanh toán gần nhất (<strong>{formatDate(new Date(lastSettlement.createdAt))}</strong>)
                </span>
              ) : (
                <span>Hiển thị tất cả lịch sử phát sinh</span>
              )}
            </span>
            {lastSettlement && (
              <button
                type="button"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer ml-2 shrink-0"
              >
                {showAllHistory ? "Chỉ xem chưa thanh toán" : "Xem tất cả lịch sử"}
              </button>
            )}
          </div>

          {/* Toggle Tab between Payer & Receiver */}
          <div className="flex p-1 bg-muted rounded-lg mt-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("PAYER")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
                isPayerTab
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Chi tiết: {fromUserName} (Người trả)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RECEIVER")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer select-none ${
                !isPayerTab
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5 text-emerald-500" />
              Chi tiết: {toUserName} (Người nhận)
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Tổng dư nợ Card */}
          <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-primary mb-1">
                <span className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" />
                  Tổng dư nợ ({targetUserName})
                </span>
                {!showAllHistory && lastSettlement && (
                  <Badge variant="outline" className="text-[10px] font-normal">Chưa thanh toán</Badge>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">1. Tiền cá nhân tiêu dùng:</span>
                  <span className="font-semibold text-rose-500">-{formatVND(totalConsumed)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">2. Tiền đứng ra ứng trước:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(totalUpfrontPaid)}</span>
                </div>
                {relevantFundAllocations.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">3. Tiền được cấp / Phát quỹ:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {netFundAdjustment >= 0 ? "+" : ""}{formatVND(netFundAdjustment)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {relevantFundAllocations.length > 0 ? "4. Thanh toán / Nhận bù nợ:" : "3. Thanh toán / Nhận bù nợ:"}
                  </span>
                  <span className="font-semibold text-blue-500">
                    {netSettlementAdjustment >= 0 ? "+" : ""}{formatVND(netSettlementAdjustment)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>
                    {calculatedNetBalance < 0
                      ? "Khoản nợ chốt hiện tại:"
                      : "Khoản sẽ nhận lại hiện tại:"}
                  </span>
                  <span
                    className={
                      calculatedNetBalance < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {formatVND(finalDisplayAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Hóa đơn tham gia chia tiền */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Receipt className="h-4 w-4 text-rose-500" />
                1. Hóa đơn tham gia chia tiền ({consumedSplits.length})
              </h4>
              <span className="text-xs font-semibold text-rose-500">
                Tổn thất: -{formatVND(totalConsumed)}
              </span>
            </div>

            {consumedSplits.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-lg text-center">
                Không có hóa đơn chia tiền mới từ lần thanh toán gần nhất.
              </p>
            ) : (
              <div className="space-y-2">
                {consumedSplits.map((item, idx) => (
                  <div
                    key={`${item.expenseId}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(new Date(item.date))} • Tổng HĐ: {formatVND(item.totalExpenseAmount)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-rose-500">-{formatVND(item.splitAmount)}</p>
                      <span className="text-[10px] text-muted-foreground">Phần được chia</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Hóa đơn ứng tiền trước */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                2. Hóa đơn tự ứng tiền túi trả ({upfrontPaidExpenses.length})
              </h4>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Đã chi: +{formatVND(totalUpfrontPaid)}
              </span>
            </div>

            {upfrontPaidExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-lg text-center">
                Không có hóa đơn đứng ra trả tiền từ lần thanh toán gần nhất.
              </p>
            ) : (
              <div className="space-y-2">
                {upfrontPaidExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{exp.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(new Date(exp.date))}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">+{formatVND(exp.amount)}</p>
                      <span className="text-[10px] text-muted-foreground">Đã ứng trả</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Tiền cấp từ Quỹ nhóm */}
          {relevantFundAllocations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <Coins className="h-4 w-4 text-purple-500" />
                  3. Tiền cấp từ Quỹ nhóm ({relevantFundAllocations.length})
                </h4>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {netFundAdjustment >= 0 ? "+" : ""}{formatVND(netFundAdjustment)}
                </span>
              </div>
              <div className="space-y-2">
                {relevantFundAllocations.map((fa) => {
                  const isRecipient = fa.toUserId === targetUserId;
                  return (
                    <div
                      key={fa.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-purple-500 shrink-0" />
                        <div>
                          <p className="font-semibold">
                            {isRecipient ? "Được cấp tiền từ Quỹ" : "Đã phát tiền Quỹ cho"}{" "}
                            <span className="text-primary font-bold">
                              {isRecipient ? (fa.fromUserName || "Quản lý quỹ") : (fa.toUserName || "Thành viên")}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(new Date(fa.date))} {fa.note ? `• ${fa.note}` : ""}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-bold ${
                          isRecipient ? "text-purple-600 dark:text-purple-400" : "text-rose-500"
                        }`}
                      >
                        {isRecipient ? "+" : "-"}{formatVND(fa.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Lịch sử thanh toán bù nợ */}
          {confirmedSettlements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                  {relevantFundAllocations.length > 0 ? "4" : "3"}. Lịch sử thanh toán bù nợ đã xác nhận ({confirmedSettlements.length})
                </h4>
              </div>
              <div className="space-y-2">
                {confirmedSettlements.map((s) => {
                  const isPayer = s.fromUserId === targetUserId;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-semibold">
                            {isPayer ? "Đã chuyển trả" : "Đã nhận tiền từ"}{" "}
                            <span className="text-primary font-bold">
                              {isPayer ? s.toUserName : s.fromUserName}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(new Date(s.createdAt))}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-bold ${
                          isPayer ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                        }`}
                      >
                        {isPayer ? "+" : "-"}{formatVND(s.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
