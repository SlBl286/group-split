"use client";

import { useState, useMemo } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  FileSpreadsheet,
  Download,
  Loader2,
  Maximize2,
  ArrowLeft,
  Receipt,
  Wallet,
  Coins,
  TrendingUp,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatVND, formatDate, getInitials } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#2563eb", // blue-600
  "#059669", // emerald-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#4f46e5", // indigo-600
  "#64748b", // slate-500
];

interface GroupReportSectionProps {
  groupId: string;
  groupName: string;
  members: {
    userId: string;
    role?: string;
    isLeft?: boolean;
    user: {
      id: string;
      displayName: string;
      username: string;
      avatar?: string | null;
    };
  }[];
  expenses: {
    id: string;
    title: string;
    description?: string | null;
    amount: number;
    status: string;
    date: Date | string;
    category: string;
    fundingSource: string;
    paidById: string;
    paidBy: {
      id: string;
      displayName: string;
      username: string;
      avatar?: string | null;
    };
    splits?: {
      id: string;
      amount: number;
      userId: string;
      user: {
        id: string;
        displayName: string;
        username: string;
        avatar?: string | null;
      };
    }[];
  }[];
  isStandalone?: boolean;
}

export function GroupReportSection({
  groupId,
  groupName,
  members,
  expenses,
  isStandalone = false,
}: GroupReportSectionProps) {
  // Preset default: Tháng này
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  const [activePreset, setActivePreset] = useState<string>("thisMonth");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<string>("ALL");
  const [selectedFundingSource, setSelectedFundingSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter presets
  const handleSetPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: now, to: now });
        break;
      case "7days":
        setDateRange({ from: subDays(now, 6), to: now });
        break;
      case "30days":
        setDateRange({ from: subDays(now, 29), to: now });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "lastMonth":
        const lastM = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastM), to: endOfMonth(lastM) });
        break;
      case "all":
        setDateRange(undefined);
        break;
    }
  };

  // Extract unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expenses (only APPROVED expenses)
  const approvedExpenses = useMemo(() => {
    return expenses.filter((e) => e.status === "APPROVED");
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return approvedExpenses.filter((e) => {
      // Date filter
      if (dateRange?.from || dateRange?.to) {
        const itemDate = new Date(e.date);
        itemDate.setHours(0, 0, 0, 0);

        if (dateRange.from && dateRange.to) {
          const from = new Date(dateRange.from);
          from.setHours(0, 0, 0, 0);
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          if (itemDate < from || itemDate > to) return false;
        } else if (dateRange.from) {
          const from = new Date(dateRange.from);
          from.setHours(0, 0, 0, 0);
          if (itemDate < from) return false;
        } else if (dateRange.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          if (itemDate > to) return false;
        }
      }

      // Category filter
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
        return false;
      }

      // Member filter (paidBy)
      if (selectedMember !== "ALL" && e.paidById !== selectedMember) {
        return false;
      }

      // Funding source filter
      if (selectedFundingSource !== "ALL" && e.fundingSource !== selectedFundingSource) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = e.title.toLowerCase().includes(q);
        const descMatch = (e.description || "").toLowerCase().includes(q);
        const paidByMatch = e.paidBy.displayName.toLowerCase().includes(q);
        const catMatch = e.category.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !paidByMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    approvedExpenses,
    dateRange,
    selectedCategory,
    selectedMember,
    selectedFundingSource,
    searchQuery,
  ]);

  // Summary Metrics
  const totalSpend = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const fundSpend = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.fundingSource === "FUND")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const memberSpend = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.fundingSource === "MEMBER")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const avgPerExpense = useMemo(() => {
    return filteredExpenses.length > 0 ? Math.round(totalSpend / filteredExpenses.length) : 0;
  }, [totalSpend, filteredExpenses.length]);

  const avgPerDay = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    let days = 1;
    if (dateRange?.from && dateRange?.to) {
      days = Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);
    } else {
      // Find span of dates in filteredExpenses
      const timestamps = filteredExpenses.map((e) => new Date(e.date).getTime());
      const minDate = Math.min(...timestamps);
      const maxDate = Math.max(...timestamps);
      days = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
    }
    return Math.round(totalSpend / days);
  }, [totalSpend, dateRange, filteredExpenses]);

  // Chart 1: Daily spending trend
  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();

    // If within a known range, populate all days in range for smooth chart
    if (dateRange?.from && dateRange?.to) {
      const cur = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      while (cur <= end) {
        const key = format(cur, "dd/MM");
        map.set(key, 0);
        cur.setDate(cur.getDate() + 1);
      }
    }

    filteredExpenses.forEach((e) => {
      const key = format(new Date(e.date), "dd/MM");
      map.set(key, (map.get(key) || 0) + e.amount);
    });

    return Array.from(map.entries()).map(([label, amount]) => ({
      label,
      amount,
    }));
  }, [filteredExpenses, dateRange]);

  // Chart 2: Category distribution
  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const cat = e.category || "Khác";
      map.set(cat, (map.get(cat) || 0) + e.amount);
    });

    return Array.from(map.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalSpend]);

  // Member Contribution & Beneficiary analysis
  const memberStats = useMemo(() => {
    const activeMembers = members.filter((m) => !m.isLeft);
    const map = new Map<string, { displayName: string; username: string; avatar?: string | null; paid: number; split: number }>();

    activeMembers.forEach((m) => {
      map.set(m.userId, {
        displayName: m.user.displayName,
        username: m.user.username,
        avatar: m.user.avatar,
        paid: 0,
        split: 0,
      });
    });

    filteredExpenses.forEach((e) => {
      // Paid
      if (e.fundingSource === "MEMBER" && e.paidById) {
        const entry = map.get(e.paidById);
        if (entry) {
          entry.paid += e.amount;
        } else {
          map.set(e.paidById, {
            displayName: e.paidBy.displayName,
            username: e.paidBy.username,
            avatar: e.paidBy.avatar,
            paid: e.amount,
            split: 0,
          });
        }
      }

      // Splits
      if (e.splits) {
        e.splits.forEach((s) => {
          const entry = map.get(s.userId);
          if (entry) {
            entry.split += s.amount;
          } else {
            map.set(s.userId, {
              displayName: s.user.displayName,
              username: s.user.username,
              avatar: s.user.avatar,
              paid: 0,
              split: s.amount,
            });
          }
        });
      }
    });

    return Array.from(map.entries())
      .map(([userId, data]) => ({
        userId,
        ...data,
        net: data.paid - data.split,
      }))
      .sort((a, b) => b.paid - a.paid);
  }, [members, filteredExpenses]);

  // Pagination for expenses table
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;

  // Handle Export Excel Action
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.set("from", format(dateRange.from, "yyyy-MM-dd"));
      }
      if (dateRange?.to) {
        params.set("to", format(dateRange.to, "yyyy-MM-dd"));
      }
      if (selectedCategory !== "ALL") {
        params.set("categoryId", selectedCategory);
      }
      if (selectedMember !== "ALL") {
        params.set("paidById", selectedMember);
      }
      if (selectedFundingSource !== "ALL") {
        params.set("fundingSource", selectedFundingSource);
      }

      const res = await fetch(`/api/groups/${groupId}/expenses/export?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Lỗi khi tải file báo cáo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      let filename = `BaoCao_${groupName}.xlsx`;
      const contentDisposition = res.headers.get("content-disposition");
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1].replace(/["']/g, ""));
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Xuất file Excel báo cáo thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-3">
          {isStandalone && (
            <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {isStandalone ? `Báo cáo thống kê: ${groupName}` : "Báo cáo & Thống kê chi tiêu"}
              </h2>
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                {filteredExpenses.length} khoản chi
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thống kê trực quan các khoản chi đã duyệt & phân bổ dòng tiền
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isStandalone && (
            <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-medium">
              <Link href={`/groups/${groupId}/reports`}>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </Link>
            </Button>
          )}

          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="h-9 px-4 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xuất...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Xuất Excel</span>
                <Download className="h-3.5 w-3.5 opacity-80" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar: Presets & DateRangePicker */}
      <Card className="border shadow-xs overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "today", label: "Hôm nay" },
                { id: "7days", label: "7 ngày" },
                { id: "30days", label: "30 ngày" },
                { id: "thisMonth", label: "Tháng này" },
                { id: "lastMonth", label: "Tháng trước" },
                { id: "all", label: "Toàn bộ" },
              ].map((p) => (
                <Button
                  key={p.id}
                  variant={activePreset === p.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetPreset(p.id)}
                  className={cn(
                    "h-8 text-xs px-2.5 cursor-pointer font-medium transition-all",
                    activePreset === p.id && "shadow-xs font-semibold"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Custom DateRangePicker */}
            <div className="shrink-0">
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setActivePreset("custom");
                }}
                placeholder="Chọn khoảng thời gian"
              />
            </div>
          </div>

          {/* Sub Filters: Category, Member, Funding Source & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t">
            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">Tất cả danh mục</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Người chi trả
              </label>
              <select
                value={selectedMember}
                onChange={(e) => {
                  setSelectedMember(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">Tất cả thành viên</option>
                {members
                  .filter((m) => !m.isLeft)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.displayName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Funding Source Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Coins className="h-3 w-3" /> Nguồn tiền
              </label>
              <select
                value={selectedFundingSource}
                onChange={(e) => {
                  setSelectedFundingSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">Tất cả nguồn tiền</option>
                <option value="MEMBER">Cá nhân tự ứng</option>
                <option value="FUND">Quỹ nhóm chi</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Search className="h-3 w-3" /> Tìm kiếm
              </label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tên, ghi chú, người chi..."
                  className="h-8 text-xs pr-7 pl-2.5"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Tổng chi tiêu */}
        <Card className="relative overflow-hidden border shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tổng chi tiêu
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
              {formatVND(totalSpend)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              Trong khoảng thời gian đã chọn
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Số khoản chi */}
        <Card className="relative overflow-hidden border shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Số hóa đơn
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {filteredExpenses.length} <span className="text-xs font-normal text-muted-foreground">khoản</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              Đã kiểm tra và phê duyệt
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Quỹ nhóm vs Cá nhân */}
        <Card className="relative overflow-hidden border shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cá nhân vs Quỹ
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between gap-1 text-xs mb-1">
              <span className="font-semibold text-foreground truncate">
                Cá nhân: {formatVND(memberSpend)}
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all"
                style={{
                  width: `${totalSpend > 0 ? (memberSpend / totalSpend) * 100 : 50}%`,
                }}
                title={`Cá nhân: ${formatVND(memberSpend)}`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{
                  width: `${totalSpend > 0 ? (fundSpend / totalSpend) * 100 : 50}%`,
                }}
                title={`Quỹ: ${formatVND(fundSpend)}`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex justify-between">
              <span>Quỹ nhóm: {formatVND(fundSpend)}</span>
              <span>
                {totalSpend > 0 ? Math.round((fundSpend / totalSpend) * 100) : 0}%
              </span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Trung bình mỗi ngày */}
        <Card className="relative overflow-hidden border shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Trung bình / ngày
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
              {formatVND(avgPerDay)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              TB mỗi khoản: {formatVND(avgPerExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts: AreaChart (Trend) & DonutChart (Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Xu hướng theo ngày */}
        <Card className="border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Xu hướng chi tiêu theo thời gian
            </CardTitle>
            <CardDescription className="text-xs">
              Biểu đồ các khoản phát sinh theo từng ngày
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {dailyChartData.length === 0 || totalSpend === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-muted-foreground text-xs text-center">
                <Receipt className="h-8 w-8 opacity-30 mb-2" />
                Chưa có dữ liệu chi tiêu trong khoảng thời gian này
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}M`
                          : v >= 1000
                          ? `${(v / 1000).toFixed(0)}K`
                          : v.toString()
                      }
                      className="fill-muted-foreground"
                      width={42}
                    />
                    <RechartsTooltip
                      formatter={(val) => [formatVND(val as number), "Chi tiêu"]}
                      labelFormatter={(label) => `Ngày ${label}`}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#spendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Cơ cấu theo Danh mục */}
        <Card className="border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-600" />
              Cơ cấu chi tiêu theo danh mục
            </CardTitle>
            <CardDescription className="text-xs">
              Tỷ trọng phần trăm các nhóm chi tiêu trong kỳ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {categoryChartData.length === 0 || totalSpend === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-muted-foreground text-xs text-center">
                <Coins className="h-8 w-8 opacity-30 mb-2" />
                Chưa có dữ liệu danh mục trong khoảng thời gian này
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {/* Donut Chart */}
                <div className="h-44 w-44 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        formatter={(val) => [formatVND(val as number), "Số tiền"]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Tổng cộng
                    </span>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-[110px]">
                      {formatVND(totalSpend)}
                    </span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 w-full max-h-[170px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                  {categoryChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs gap-2 py-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium truncate text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold">{formatVND(item.amount)}</span>
                        <span className="text-muted-foreground font-mono text-[10px] w-9 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Member Contribution & Beneficiary Section */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            Thống kê chi tiêu & thụ hưởng theo thành viên
          </CardTitle>
          <CardDescription className="text-xs">
            Tổng số tiền từng thành viên đã chi trả trực tiếp so với số tiền được chia trong kỳ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {memberStats.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Chưa có thành viên nào</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {memberStats.map((m) => {
                const paidRatio = totalSpend > 0 ? (m.paid / totalSpend) * 100 : 0;
                return (
                  <div
                    key={m.userId}
                    className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8 border shrink-0">
                          <AvatarImage src={m.avatar || undefined} alt={m.displayName} />
                          <AvatarFallback className="text-[11px] font-bold">
                            {getInitials(m.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{m.displayName}</p>
                          <p className="text-[10px] text-muted-foreground">@{m.username}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant={m.net > 0 ? "default" : m.net < 0 ? "destructive" : "secondary"}
                          className="text-[11px] font-mono px-2 py-0.5"
                        >
                          {m.net > 0 ? `+${formatVND(m.net)}` : m.net < 0 ? formatVND(m.net) : "0đ"}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress bars & comparison */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Đã trả: <strong className="text-foreground">{formatVND(m.paid)}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Thụ hưởng: <strong className="text-foreground">{formatVND(m.split)}</strong>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, paidRatio))}%` }}
                          title={`Tỷ lệ chi trả: ${paidRatio.toFixed(1)}%`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Expenses Table */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Chi tiết các khoản chi ({filteredExpenses.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Danh sách chi tiêu tương ứng với bộ lọc đã chọn
            </CardDescription>
          </div>
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Tải Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
              <Receipt className="h-8 w-8 mx-auto opacity-30" />
              <p>Không tìm thấy khoản chi nào thỏa mãn điều kiện lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3 text-left w-12">STT</th>
                    <th className="py-2.5 px-3 text-left w-24">Ngày</th>
                    <th className="py-2.5 px-3 text-left">Nội dung</th>
                    <th className="py-2.5 px-3 text-left w-28">Danh mục</th>
                    <th className="py-2.5 px-3 text-left w-36">Người trả</th>
                    <th className="py-2.5 px-3 text-left w-28">Nguồn</th>
                    <th className="py-2.5 px-3 text-right w-32">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedExpenses.map((e, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(e.date), "dd/MM/yyyy")}
                        </td>
                        <td className="py-2.5 px-3">
                          <Link
                            href={`/groups/${groupId}/expenses/${e.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                          >
                            {e.title}
                          </Link>
                          {e.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {e.description}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
                            {e.category || "Khác"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Avatar className="h-5 w-5 border shrink-0">
                              <AvatarImage src={e.paidBy.avatar || undefined} alt={e.paidBy.displayName} />
                              <AvatarFallback className="text-[9px]">
                                {getInitials(e.paidBy.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{e.paidBy.displayName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {e.fundingSource === "FUND" ? (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-normal">
                              Quỹ nhóm
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                              Cá nhân
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                          {formatVND(e.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t bg-muted/10 text-xs">
              <span className="text-muted-foreground">
                Trang {currentPage} / {totalPages} (Tổng {filteredExpenses.length} khoản)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
