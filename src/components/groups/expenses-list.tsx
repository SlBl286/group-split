"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { ExpenseApproveButton } from "./expense-approve-button";
import { formatVND, formatDate } from "@/lib/utils/format";
import { Receipt, Calendar, ArrowLeft, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Split {
  id: string;
  amount: number;
  isPaid: boolean;
  user: {
    displayName: string;
  };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  splitType: string;
  status: string;
  date: string;
  category: string;
  paidBy: {
    displayName: string;
  };
  splits: Split[];
}

interface ExpensesListProps {
  expenses: Expense[];
  isOwner: boolean;
  groupId: string;
  currentUserId: string;
  currentUserName: string;
}

const categoryEmojis: Record<string, string> = {
  "Ăn uống": "🍽️",
  "Di chuyển": "🚗",
  "Mua sắm": "🛒",
  "Giải trí": "🎉",
  "Sinh hoạt": "🏠",
  "Khác": "📦",
};

const statusIcon = {
  APPROVED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  PENDING: <Clock className="h-4 w-4 text-amber-500" />,
  REJECTED: <XCircle className="h-4 w-4 text-rose-500" />,
};

const statusLabel = {
  APPROVED: "Đã duyệt",
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối",
};

export function ExpensesList({ expenses, isOwner, groupId, currentUserId, currentUserName }: ExpensesListProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter expenses by date range
  const filteredExpenses = expenses.filter((e) => {
    const eTime = new Date(e.date).getTime();
    if (dateRange?.from) {
      const fromTime = new Date(dateRange.from).setHours(0, 0, 0, 0);
      if (eTime < fromTime) return false;
    }
    if (dateRange?.to) {
      const toTime = new Date(dateRange.to).setHours(23, 59, 59, 999);
      if (eTime > toTime) return false;
    }
    return true;
  });

  // Sort by date newest first
  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Pagination config
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  // Group by Month function
  const groupExpensesByMonth = (list: Expense[]) => {
    const groups: Record<string, Expense[]> = {};
    for (const exp of list) {
      const d = new Date(exp.date);
      const monthStr = `Tháng ${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      if (!groups[monthStr]) {
        groups[monthStr] = [];
      }
      groups[monthStr].push(exp);
    }
    return groups;
  };

  const groupedExpenses = groupExpensesByMonth(paginatedExpenses);

  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="text-left w-full md:w-auto space-y-0.5">
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Bộ lọc khoảng thời gian
            </h4>
            <p className="text-[11px] text-muted-foreground">Lọc danh sách hoá đơn của nhóm</p>
          </div>
          <div className="w-full md:w-auto flex items-stretch md:items-center justify-start md:justify-end">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder="Chọn khoảng ngày"
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses list */}
      {filteredExpenses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-3">Không có hoá đơn nào khớp bộ lọc</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([monthHeader, list]) => (
            <div key={monthHeader} className="space-y-3">
              <div className="flex items-center gap-2 px-1 py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                  {monthHeader}
                </span>
                <div className="h-px bg-border flex-1" />
              </div>

              {list.map((expense) => (
                <Card key={expense.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-medium text-sm">{expense.title}</h3>
                          <Badge variant="secondary" className="text-[11px] font-medium py-0 px-2 h-5">
                            {categoryEmojis[expense.category] || "📦"} {expense.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {statusIcon[expense.status as keyof typeof statusIcon]}
                            <span className="text-xs text-muted-foreground">
                              {statusLabel[expense.status as keyof typeof statusLabel]}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {expense.splitType === "EQUAL" ? "Chia đều" : "Chia riêng"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Người trả:{" "}
                          <span className={`font-semibold ${
                            expense.paidBy.displayName === currentUserName
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-foreground"
                          }`}>
                            {expense.paidBy.displayName === currentUserName
                              ? "Bạn"
                              : expense.paidBy.displayName}
                          </span>{" "}
                          • {formatDate(expense.date)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {expense.splits.map((split) => {
                            const isCurrentUser = split.user.displayName === currentUserName;
                            return (
                              <span
                                key={split.id}
                                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                                  isCurrentUser
                                    ? split.isPaid
                                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20"
                                    : split.isPaid
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isCurrentUser ? "Bạn" : split.user.displayName}: {formatVND(split.amount)}
                                {split.isPaid && " ✓"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base">{formatVND(expense.amount)}</p>
                        {isOwner && expense.status === "PENDING" && (
                          <ExpenseApproveButton expenseId={expense.id} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-1">
              <span className="text-xs text-muted-foreground">
                Trang {currentPage} / {totalPages} (Tổng {filteredExpenses.length} hoá đơn)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 gap-1 font-semibold text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 gap-1 font-semibold text-xs"
                >
                  Trang sau
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
