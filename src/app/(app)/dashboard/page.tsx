import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/utils/format";
import { calculateDebts } from "@/lib/debt-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/format";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  ArrowRight,
  Plus,
  Wallet,
} from "lucide-react";
import { SpendingChart } from "@/components/dashboard/spending-chart";

export const metadata = {
  title: "Dashboard - GroupSplit",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id!;

  // Fetch user's groups
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: { include: { user: true } },
          expenses: {
            where: { status: "APPROVED" },
            include: { splits: true },
          },
          settlements: { where: { isConfirmed: true } },
        },
      },
    },
  });

  // Calculate overall balance across all groups
  let totalOwed = 0; // tôi nợ người khác
  let totalOwing = 0; // người khác nợ tôi
  const allDebts: Array<{
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
    groupName: string;
  }> = [];

  for (const membership of memberships) {
    const { group } = membership;
    const { debts } = calculateDebts(
      group.expenses,
      group.members,
      group.settlements,
      group.ownerId
    );

    for (const debt of debts) {
      if (debt.fromUserId === userId) {
        totalOwed += debt.amount;
        allDebts.push({ ...debt, groupName: group.name });
      } else if (debt.toUserId === userId) {
        totalOwing += debt.amount;
        allDebts.push({ ...debt, groupName: group.name });
      }
    }
  }

  // Monthly spending data for chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentExpenses = await prisma.expense.findMany({
    where: {
      status: "APPROVED",
      date: { gte: sixMonthsAgo },
      group: { members: { some: { userId } } },
    },
    include: { splits: { where: { userId } } },
    orderBy: { date: "asc" },
  });

  // Group expenses by month
  const monthlyMap = new Map<string, number>();
  for (const expense of recentExpenses) {
    const key = new Date(expense.date).toLocaleDateString("vi-VN", {
      month: "short",
      year: "2-digit",
    });
    const myShare = expense.splits[0]?.amount ?? 0;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + myShare);
  }

  const chartData = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
    month,
    amount,
  }));

  const netBalance = totalOwing - totalOwed;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Xin chào, <span className="font-medium text-foreground">{session!.user.name}</span>!
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Được nhận</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500">
              {formatVND(totalOwing)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Người khác nợ bạn</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500/10 to-rose-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Phải trả</p>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-500">
              {formatVND(totalOwed)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Bạn nợ người khác</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm bg-gradient-to-br ${netBalance >= 0 ? "from-blue-500/10 to-blue-500/5" : "from-orange-500/10 to-orange-500/5"}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Số dư ròng</p>
              <Wallet className={`h-4 w-4 ${netBalance >= 0 ? "text-blue-500" : "text-orange-500"}`} />
            </div>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-500" : "text-orange-500"}`}>
              {netBalance >= 0 ? "+" : ""}{formatVND(netBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {netBalance >= 0 ? "Bạn đang được lợi" : "Bạn đang nợ tổng cộng"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chi tiêu 6 tháng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart data={chartData} />
          </CardContent>
        </Card>

        {/* My debts summary */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dư nợ của tôi</CardTitle>
            {allDebts.length > 3 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/groups">Xem tất cả</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {allDebts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Không có dư nợ nào 🎉</p>
              </div>
            ) : (
              allDebts.slice(0, 4).map((debt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    debt.fromUserId === userId
                      ? "bg-rose-500/5 border border-rose-500/20"
                      : "bg-emerald-500/5 border border-emerald-500/20"
                  }`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(
                        debt.fromUserId === userId
                          ? debt.toUserName
                          : debt.fromUserName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {debt.fromUserId === userId ? (
                        <>Bạn → {debt.toUserName}</>
                      ) : (
                        <>{debt.fromUserName} → Bạn</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {debt.groupName}
                    </p>
                  </div>
                  <Badge
                    variant={debt.fromUserId === userId ? "destructive" : "default"}
                    className="shrink-0 text-xs"
                  >
                    {formatVND(debt.amount)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Groups overview */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Nhóm của tôi</CardTitle>
          <Button size="sm" asChild>
            <Link href="/groups/new" className="gap-1">
              <Plus className="h-4 w-4" />
              Tạo nhóm
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm mb-3">Bạn chưa tham gia nhóm nào</p>
              <Button asChild size="sm">
                <Link href="/groups/new">Tạo nhóm đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {memberships.map(({ group }) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border hover:bg-accent transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {group.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.members.length} thành viên
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
