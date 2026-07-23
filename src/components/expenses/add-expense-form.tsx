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
import { Loader2, Equal, Sliders, Check, ChevronDown } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function flattenTree(nodes: CategoryNode[], depth = 0): Array<{ category: CategoryNode; depth: number }> {
  const result: Array<{ category: CategoryNode; depth: number }> = [];
  nodes.forEach((node) => {
    result.push({ category: node, depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  });
  return result;
}

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
  const [customPercents, setCustomPercents] = useState<Record<string, string>>({});
  const [customSplitSubtype, setCustomSplitSubtype] = useState<"AMOUNT" | "PERCENT">("AMOUNT");
  const [paidById, setPaidById] = useState(currentUserId);
  const [category, setCategory] = useState("Khác");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`/api/groups/${groupId}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          // Mặc định chọn danh mục gốc "Khác"
          const defaultCat = data.find((c: Category) => c.name === "Khác" && c.parentId === null) || data[0];
          if (defaultCat) {
            setSelectedCategoryId(defaultCat.id);
            setCategory(defaultCat.name);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    }
    loadCategories();
  }, [groupId]);

  const parsedAmount = parseFloat(amount) || 0;

  // Equal split amount per person
  const equalShare =
    selectedMembers.size > 0 ? parsedAmount / selectedMembers.size : 0;

  // Custom splits total
  const customTotal = customSplitSubtype === "AMOUNT"
    ? Object.entries(customSplits)
        .filter(([userId]) => selectedMembers.has(userId))
        .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0)
    : Object.entries(customPercents)
        .filter(([userId]) => selectedMembers.has(userId))
        .reduce((sum, [, val]) => sum + (parsedAmount * (parseFloat(val) || 0) / 100), 0);

  const customRemaining = parsedAmount - customTotal;

  // Unassigned members (no value entered or equals 0)
  const unassignedMembers = Array.from(selectedMembers).filter((userId) => {
    if (customSplitSubtype === "AMOUNT") {
      const val = customSplits[userId];
      return !val || parseFloat(val) === 0;
    } else {
      const val = customPercents[userId];
      return !val || parseFloat(val) === 0;
    }
  });

  function handleAutoDistributeRemaining() {
    if (unassignedMembers.length < 2) return;

    if (customSplitSubtype === "AMOUNT") {
      const assignedSum = Array.from(selectedMembers)
        .filter((userId) => !unassignedMembers.includes(userId))
        .reduce((sum, userId) => sum + (parseFloat(customSplits[userId]) || 0), 0);
      const remaining = parsedAmount - assignedSum;
      if (remaining <= 0) return;

      const share = Math.round(remaining / unassignedMembers.length);
      const nextSplits = { ...customSplits };
      
      let distributedSum = 0;
      unassignedMembers.forEach((userId, index) => {
        if (index === unassignedMembers.length - 1) {
          const lastShare = remaining - distributedSum;
          nextSplits[userId] = lastShare > 0 ? lastShare.toString() : "0";
        } else {
          nextSplits[userId] = share.toString();
          distributedSum += share;
        }
      });
      setCustomSplits(nextSplits);
    } else {
      const assignedSum = Array.from(selectedMembers)
        .filter((userId) => !unassignedMembers.includes(userId))
        .reduce((sum, userId) => sum + (parseFloat(customPercents[userId]) || 0), 0);
      const remaining = 100 - assignedSum;
      if (remaining <= 0) return;

      const share = remaining / unassignedMembers.length;
      const nextPercents = { ...customPercents };

      let distributedSum = 0;
      unassignedMembers.forEach((userId, index) => {
        if (index === unassignedMembers.length - 1) {
          const lastShare = Number((remaining - distributedSum).toFixed(1));
          nextPercents[userId] = lastShare > 0 ? lastShare.toString() : "0";
        } else {
          const formattedShare = Number(share.toFixed(1));
          nextPercents[userId] = formattedShare.toString();
          distributedSum += formattedShare;
        }
      });
      setCustomPercents(nextPercents);
    }
  }

  function handleSwitchSubtype(type: "AMOUNT" | "PERCENT") {
    if (type === customSplitSubtype) return;

    if (type === "PERCENT") {
      const nextPercents: Record<string, string> = {};
      selectedMembers.forEach((userId) => {
        const amt = parseFloat(customSplits[userId] || "0");
        if (amt > 0 && parsedAmount > 0) {
          const pct = ((amt / parsedAmount) * 100).toFixed(1);
          nextPercents[userId] = pct.endsWith(".0") ? pct.slice(0, -2) : pct;
        } else {
          nextPercents[userId] = "";
        }
      });
      setCustomPercents(nextPercents);
    } else {
      const nextSplits: Record<string, string> = {};
      selectedMembers.forEach((userId) => {
        const pct = parseFloat(customPercents[userId] || "0");
        if (pct > 0) {
          const amt = Math.round(parsedAmount * (pct / 100));
          nextSplits[userId] = amt > 0 ? amt.toString() : "";
        } else {
          nextSplits[userId] = "";
        }
      });
      setCustomSplits(nextSplits);
    }
    setCustomSplitSubtype(type);
  }

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
    if (loading) return;
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
      splits = Array.from(selectedMembers).map((userId) => {
        let memberAmount = 0;
        if (customSplitSubtype === "AMOUNT") {
          memberAmount = parseFloat(customSplits[userId] || "0");
        } else {
          const pct = parseFloat(customPercents[userId] || "0");
          memberAmount = Math.round(parsedAmount * (pct / 100));
        }
        return {
          userId,
          amount: memberAmount,
        };
      });

      // Adjust last item to absorb rounding difference if any
      const totalSplitsSum = splits.reduce((sum, s) => sum + s.amount, 0);
      const diff = parsedAmount - totalSplitsSum;
      if (diff !== 0 && splits.length > 0) {
        splits[splits.length - 1].amount += diff;
      }

      if (Math.abs(customRemaining) > 1) {
        toast.error(`Còn thiếu ${formatVND(Math.abs(customRemaining))} chưa phân bổ`);
        setLoading(false);
        return;
      }
    }

    try {
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
          categoryId: selectedCategoryId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Thêm hoá đơn thất bại");
        setLoading(false);
      } else {
        toast.success("Đã thêm hoá đơn! Đang chờ owner duyệt.");
        router.push(`/groups/${groupId}`);
      }
    } catch (err) {
      console.error("Lỗi khi thêm hoá đơn:", err);
      toast.error("Đã xảy ra lỗi kết nối, vui lòng thử lại");
      setLoading(false);
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

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label>Danh mục chi tiêu *</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger className="w-full h-11 justify-between text-left font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg px-3 flex items-center cursor-pointer select-none">
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-lg shrink-0">
                    {categories.find((c) => c.id === selectedCategoryId)?.icon || "📦"}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {categories.find((c) => c.id === selectedCategoryId)?.name || "Chọn danh mục..."}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </PopoverTrigger>
              <PopoverContent className="w-[300px] sm:w-[350px] p-1.5 z-50 bg-popover border border-border shadow-md rounded-lg max-h-[300px] overflow-y-auto" align="start">
                {categories.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">Đang tải danh mục...</p>
                ) : (
                  <div className="space-y-0.5">
                    {flattenTree(buildCategoryTree(categories)).map(({ category: cat, depth }) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setCategory(cat.name); // Fallback name
                          setCategoryOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg hover:bg-muted text-left transition-colors cursor-pointer ${
                          selectedCategoryId === cat.id ? "bg-primary/10 text-primary" : "text-foreground"
                        }`}
                        style={{ paddingLeft: `${depth * 16 + 12}px` }}
                      >
                        <span className="text-base shrink-0">{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Tổng tiền (VND) *</Label>
              <div className="relative">
                <Input
                  id="expense-amount"
                  type="text"
                  value={amount ? parseInt(amount).toLocaleString("vi-VN") : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setAmount(raw);
                  }}
                  placeholder="0"
                  required
                  className="h-11 pr-12 font-mono text-base"
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
            <div className="space-y-2 flex flex-col justify-start">
              <Label className="h-5 flex items-center">Ngày</Label>
              <DatePicker
                value={date}
                onChange={(newDate) => setDate(newDate || new Date())}
              />
            </div>
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
          
          {/* Custom mode switch */}
          {splitType === "CUSTOM" && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Chế độ chia riêng:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchSubtype("AMOUNT")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    customSplitSubtype === "AMOUNT"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Số tiền (đ)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSubtype("PERCENT")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    customSplitSubtype === "PERCENT"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Tỷ lệ (%)
                </button>
              </div>
            </div>
          )}

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
                      <div className="shrink-0 flex items-center gap-2">
                        {splitType === "EQUAL" ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {parsedAmount > 0 ? formatVND(equalShare) : "—"}
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            {customSplitSubtype === "PERCENT" && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                ({formatVND(parsedAmount * (parseFloat(customPercents[m.userId] || "0") / 100))})
                              </span>
                            )}
                            <div className="relative">
                              <Input
                                value={
                                  customSplitSubtype === "AMOUNT"
                                    ? (customSplits[m.userId] ? parseInt(customSplits[m.userId]).toLocaleString("vi-VN") : "")
                                    : (customPercents[m.userId] || "")
                                }
                                onChange={(e) => {
                                  if (customSplitSubtype === "AMOUNT") {
                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                    setCustomSplits((prev) => ({
                                      ...prev,
                                      [m.userId]: raw,
                                    }));
                                  } else {
                                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                                    const parts = raw.split(".");
                                    const clean = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
                                    setCustomPercents((prev) => ({
                                      ...prev,
                                      [m.userId]: clean,
                                    }));
                                  }
                                }}
                                placeholder="0"
                                className="w-28 h-8 text-right text-xs font-mono pr-7"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                {customSplitSubtype === "AMOUNT" ? "đ" : "%"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {splitType === "CUSTOM" && parsedAmount > 0 && (
              <div className="space-y-3 mt-3">
                {unassignedMembers.length >= 2 && customRemaining > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoDistributeRemaining}
                    className="w-full text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 gap-1.5 h-9"
                  >
                    <Equal className="h-3.5 w-3.5" />
                    Chia đều {formatVND(customRemaining)} còn lại cho {unassignedMembers.length} người chưa điền
                  </Button>
                )}
                
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-12 text-base font-semibold border-border hover:bg-accent"
          onClick={() => router.back()}
          disabled={loading}
        >
          Huỷ
        </Button>
        <Button 
          type="submit" 
          size="lg" 
          className="flex-1 h-12 text-base font-semibold shadow-md gap-2" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Thêm hoá đơn"
          )}
        </Button>
      </div>
    </form>
  );
}
