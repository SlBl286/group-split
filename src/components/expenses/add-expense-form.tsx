"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatVND, getInitials } from "@/lib/utils/format";
import { Loader2, Equal, Sliders, Check } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface Member {
  userId: string;
  displayName: string;
  avatar?: string | null;
}

interface AddExpenseFormProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
}

const CATEGORIES = [
  { id: "Ăn uống", label: "Ăn uống", emoji: "🍽️" },
  { id: "Di chuyển", label: "Di chuyển", emoji: "🚗" },
  { id: "Mua sắm", label: "Mua sắm", emoji: "🛒" },
  { id: "Giải trí", label: "Giải trí", emoji: "🎉" },
  { id: "Sinh hoạt", label: "Sinh hoạt", emoji: "🏠" },
  { id: "Khác", label: "Khác", emoji: "📦" },
];

export function AddExpenseForm({ groupId, members, currentUserId }: AddExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [amount, setAmount] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [paidById, setPaidById] = useState(currentUserId);
  const [category, setCategory] = useState("Khác");
  const [date, setDate] = useState<Date>(new Date());

  const parsedAmount = parseFloat(amount) || 0;

  // Equal split amount per person
  const equalShare =
    selectedMembers.size > 0 ? parsedAmount / selectedMembers.size : 0;

  // Custom splits total
  const customTotal = Object.entries(customSplits)
    .filter(([userId]) => selectedMembers.has(userId))
    .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

  const customRemaining = parsedAmount - customTotal;

  function toggleMember(userId: string) {
    const next = new Set(selectedMembers);
    if (next.has(userId)) {
      if (next.size <= 1) return; // tối thiểu 1 người
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedMembers(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (parsedAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dateStr = date.toISOString();

    // Build splits
    let splits: { userId: string; amount: number }[];

    if (splitType === "EQUAL") {
      splits = Array.from(selectedMembers).map((userId) => ({
        userId,
        amount: Math.round(equalShare),
      }));
    } else {
      splits = Array.from(selectedMembers).map((userId) => ({
        userId,
        amount: parseFloat(customSplits[userId] || "0"),
      }));

      if (Math.abs(customRemaining) > 1) {
        toast.error(`Còn thiếu ${formatVND(Math.abs(customRemaining))} chưa phân bổ`);
        setLoading(false);
        return;
      }
    }

    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        amount: parsedAmount,
        paidById,
        splitType,
        date: dateStr,
        splits,
        category,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Thêm hoá đơn thất bại");
    } else {
      toast.success("Đã thêm hoá đơn! Đang chờ owner duyệt.");
      router.push(`/groups/${groupId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="expense-title">Tên hoá đơn *</Label>
            <Input
              id="expense-title"
              name="title"
              placeholder="VD: Tiền ăn trưa, Tiền xăng..."
              required
              className="h-11"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Danh mục chi tiêu</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    category === cat.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <span className="text-xl mb-1">{cat.emoji}</span>
                  <span className="truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Tổng tiền (VND) *</Label>
            <div className="relative">
              <Input
                id="expense-amount"
                value={amount ? parseInt(amount).toLocaleString("vi-VN") : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(raw);
                }}
                placeholder="0"
                required
                className="h-11 pr-12 text-right font-mono text-base"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                VND
              </span>
            </div>
            {parsedAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                = {formatVND(parsedAmount)}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2 flex flex-col">
            <Label>Ngày</Label>
            <DatePicker
              value={date}
              onChange={(newDate) => setDate(newDate || new Date())}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="expense-desc">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="expense-desc"
              name="description"
              placeholder="Mô tả thêm..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payer */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label>Ai là người đã trả? *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => setPaidById(m.userId)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  paidById === m.userId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  {m.avatar && (
                    <AvatarImage src={m.avatar} alt={m.displayName} className="object-cover" />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(m.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{m.displayName}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Split type */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSplitType("EQUAL")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                splitType === "EQUAL"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent"
              }`}
            >
              <Equal className="h-4 w-4" />
              Chia đều
            </button>
            <button
              type="button"
              onClick={() => setSplitType("CUSTOM")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                splitType === "CUSTOM"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent"
              }`}
            >
              <Sliders className="h-4 w-4" />
              Chia riêng
            </button>
          </div>

          <Separator />

          {/* Member selection */}
          <div className="space-y-2">
            <Label>Ai trong hoá đơn này?</Label>
            <div className="space-y-2">
              {members.map((m) => {
                const isSelected = selectedMembers.has(m.userId);
                return (
                  <div
                    key={m.userId}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSelected ? "border-primary/50 bg-primary/5" : "border-border opacity-60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(m.userId)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                     <Avatar className="h-7 w-7 shrink-0">
                      {m.avatar && (
                        <AvatarImage src={m.avatar} alt={m.displayName} className="object-cover" />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{m.displayName}</span>
                    {isSelected && (
                      <div className="shrink-0">
                        {splitType === "EQUAL" ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {parsedAmount > 0 ? formatVND(equalShare) : "—"}
                          </Badge>
                        ) : (
                          <div className="relative">
                            <Input
                              value={customSplits[m.userId] ? parseInt(customSplits[m.userId]).toLocaleString("vi-VN") : ""}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, "");
                                setCustomSplits((prev) => ({
                                  ...prev,
                                  [m.userId]: raw,
                                }));
                              }}
                              placeholder="0"
                              className="w-32 h-8 text-right text-xs font-mono pr-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              đ
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {splitType === "CUSTOM" && parsedAmount > 0 && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  Math.abs(customRemaining) < 1
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {Math.abs(customRemaining) < 1
                  ? "✓ Đã phân bổ đủ số tiền"
                  : customRemaining > 0
                  ? `Còn ${formatVND(customRemaining)} chưa phân bổ`
                  : `Đã vượt ${formatVND(-customRemaining)}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Huỷ
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang thêm...
            </>
          ) : (
            "Thêm hoá đơn"
          )}
        </Button>
      </div>
    </form>
  );
}
