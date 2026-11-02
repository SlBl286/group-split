import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { calculateDebts } from "@/lib/debt-calculator";
import { startOfMonth, endOfMonth, subMonths, subDays, addDays, addMonths, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = user.id;
    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const rangeParam = url.searchParams.get("range"); // "thisMonth" | "30days" | "lastMonth" | "all"

    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let isAllTime = false;

    if (rangeParam === "all") {
      isAllTime = true;
    } else if (rangeParam === "30days") {
      startDate = subDays(today, 29);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (rangeParam === "lastMonth") {
      const lastMonth = subMonths(today, 1);
      startDate = startOfMonth(lastMonth);
      startDate.setHours(0, 0, 0, 0);
      endDate = endOfMonth(lastMonth);
      endDate.setHours(23, 59, 59, 999);
    } else if (fromStr && toStr) {
      startDate = new Date(fromStr);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toStr);
      endDate.setHours(23, 59, 59, 999);
    } else if (rangeParam === "thisMonth") {
      startDate = startOfMonth(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = endOfMonth(today);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: check if current month has expenses, otherwise default to all-time
      const testThisMonth = await prisma.expense.findFirst({
        where: {
          status: "APPROVED",
          date: { gte: startOfMonth(today), lte: endOfMonth(today) },
          splits: { some: { userId } },
        },
        select: { id: true },
      });

      if (testThisMonth) {
        startDate = startOfMonth(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = endOfMonth(today);
        endDate.setHours(23, 59, 59, 999);
      } else {
        isAllTime = true;
      }
    }

    const whereDateClause: any = {};
    if (!isAllTime && startDate && endDate) {
      whereDateClause.date = { gte: startDate, lte: endDate };
    }

    // 1. Fetch expenses where user has a split
    let expenses: any[] = [];
    try {
      expenses = await prisma.expense.findMany({
        where: {
          status: "APPROVED",
          ...whereDateClause,
          splits: { some: { userId } },
        },
        include: {
          group: { select: { id: true, name: true, avatar: true } },
          categoryRel: true,
          paidBy: { select: { id: true, displayName: true, username: true, avatar: true } },
          splits: { where: { userId } },
        },
        orderBy: { date: "desc" },
      });
    } catch (_) {
      expenses = [];
    }

    // 2. Calculate spending metrics
    const totalSpending = expenses.reduce((sum, exp) => {
      const myShare = exp.splits[0]?.amount ?? 0;
      return sum + myShare;
    }, 0);

    const transactionCount = expenses.length;
    let daysDiff = 30;
    if (startDate && endDate) {
      daysDiff = Math.max(
        1,
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
    } else if (expenses.length > 0) {
      const oldestDate = new Date(expenses[expenses.length - 1].date);
      const newestDate = new Date(expenses[0].date);
      daysDiff = Math.max(
        1,
        Math.round((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
    }
    const dailyAverage = totalSpending / daysDiff;

    // 3. Category breakdown
    const categoryMap = new Map<string, { name: string; icon: string; amount: number }>();
    for (const exp of expenses) {
      const catId = exp.categoryId ?? exp.category ?? "Khác";
      const catName = exp.categoryRel?.name ?? exp.category ?? "Khác";
      const catIcon = exp.categoryRel?.icon ?? "📦";
      const myShare = exp.splits[0]?.amount ?? 0;

      const existing = categoryMap.get(catId) ?? { name: catName, icon: catIcon, amount: 0 };
      existing.amount += myShare;
      categoryMap.set(catId, existing);
    }

    const spendingByCategory = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        icon: data.icon,
        amount: data.amount,
        percentage: totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Time series chart data
    const isMonthly = isAllTime || daysDiff > 31;
    const timeMap = new Map<string, number>();

    if (isMonthly) {
      for (const exp of expenses) {
        const key = new Date(exp.date).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });
        const myShare = exp.splits[0]?.amount ?? 0;
        timeMap.set(key, (timeMap.get(key) ?? 0) + myShare);
      }
    } else if (startDate && endDate) {
      let current = new Date(startDate);
      while (current <= endDate) {
        const key = current.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        timeMap.set(key, 0);
        current = addDays(current, 1);
      }
      for (const exp of expenses) {
        const key = new Date(exp.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        if (timeMap.has(key)) {
          const myShare = exp.splits[0]?.amount ?? 0;
          timeMap.set(key, (timeMap.get(key) ?? 0) + myShare);
        }
      }
    }

    const chartData = Array.from(timeMap.entries()).map(([label, amount]) => ({
      label,
      amount,
    }));

    // 5. Cumulative Group Balances (who owes whom across all user groups)
    let allMemberships: any[] = [];
    try {
      allMemberships = await prisma.groupMember.findMany({
        where: { userId, isLeft: false },
        include: {
          group: {
            include: {
              members: { include: { user: true } },
              expenses: {
                where: { status: "APPROVED" },
                include: { splits: true },
              },
              settlements: { where: { isConfirmed: true } },
              fundAllocations: true,
            },
          },
        },
      });
    } catch (_) {
      allMemberships = [];
    }

    const groupBalances: Array<{
      groupId: string;
      groupName: string;
      balance: number;
    }> = [];

    let totalOwedToUser = 0;
    let totalUserOwes = 0;

    for (const membership of allMemberships) {
      const { group } = membership;
      const { debts, balances } = calculateDebts(
        group.expenses,
        group.members,
        group.settlements,
        group.ownerId,
        group.fundAllocations
      );

      const myBalance = balances.find((b) => b.userId === userId)?.balance ?? 0;
      groupBalances.push({
        groupId: group.id,
        groupName: group.name,
        balance: myBalance,
      });

      for (const debt of debts) {
        if (debt.toUserId === userId) {
          totalOwedToUser += debt.amount;
        } else if (debt.fromUserId === userId) {
          totalUserOwes += debt.amount;
        }
      }
    }

    const netBalance = totalOwedToUser - totalUserOwes;

    return NextResponse.json({
      success: true,
      activeRange: isAllTime ? "all" : (rangeParam || "thisMonth"),
      totalSpending,
      dailyAverage,
      transactionCount,
      totalOwedToUser,
      totalUserOwes,
      netBalance,
      groupBalances,
      spendingByCategory,
      chartData,
      recentExpenses: expenses.slice(0, 10).map((exp) => ({
        id: exp.id,
        title: exp.title,
        amount: exp.amount,
        myShare: exp.splits[0]?.amount ?? 0,
        date: exp.date,
        groupName: exp.group.name,
        groupId: exp.groupId,
        paidByName: exp.paidBy.displayName,
        category: exp.categoryRel?.name ?? exp.category ?? "Khác",
        categoryIcon: exp.categoryRel?.icon ?? "📦",
      })),
    });
  } catch (error: any) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
