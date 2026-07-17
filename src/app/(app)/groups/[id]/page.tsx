export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatVND, formatDate, getInitials, generateInviteUrl } from "@/lib/utils/format";
import { calculateDebts } from "@/lib/debt-calculator";
import { GroupRealtimeListener } from "@/components/groups/group-realtime-listener";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Plus,
  Crown,
  Receipt,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { InviteSection } from "@/components/groups/invite-section";
import { AddMemberForm } from "@/components/groups/add-member-form";
import { ExpenseApproveButton } from "@/components/groups/expense-approve-button";
import { SettlementSection } from "@/components/groups/settlement-section";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });
  return { title: group ? `${group.name} - GroupSplit` : "Nhóm - GroupSplit" };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id!;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      owner: true,
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
      expenses: {
        include: {
          paidBy: true,
          createdBy: true,
          splits: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      settlements: {
        include: { fromUser: true, toUser: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) redirect("/groups");

  const isOwner = group.ownerId === userId;
  const approvedExpenses = group.expenses.filter((e) => e.status === "APPROVED");
  const pendingExpenses = group.expenses.filter((e) => e.status === "PENDING");

  const { debts, balances } = calculateDebts(
    approvedExpenses,
    group.members,
    group.settlements,
    group.ownerId
  );

  const myBalance = balances.find((b) => b.userId === userId);

  const inviteUrl = generateInviteUrl(group.inviteCode);

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

  const categoryEmojis: Record<string, string> = {
    "Ăn uống": "🍽️",
    "Di chuyển": "🚗",
    "Mua sắm": "🛒",
    "Giải trí": "🎉",
    "Sinh hoạt": "🏠",
    "Khác": "📦",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GroupRealtimeListener groupId={id} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            {isOwner && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                Owner
              </Badge>
            )}
          </div>
          {group.description && (
            <p className="text-muted-foreground text-sm">{group.description}</p>
          )}
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link href={`/groups/${id}/expenses/new`}>
            <Plus className="h-4 w-4" />
            Thêm hoá đơn
          </Link>
        </Button>
      </div>

      {/* Balance summary */}
      {myBalance && (
        <Card className={`border-0 shadow-sm ${
          myBalance.balance > 0
            ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
            : myBalance.balance < 0
            ? "bg-gradient-to-br from-rose-500/10 to-rose-500/5"
            : "bg-gradient-to-br from-blue-500/10 to-blue-500/5"
        }`}>
          <CardContent className="p-5 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Số dư của bạn trong nhóm này</p>
              <p className={`text-3xl font-bold mt-1 ${
                myBalance.balance > 0
                  ? "text-emerald-500"
                  : myBalance.balance < 0
                  ? "text-rose-500"
                  : "text-blue-500"
              }`}>
                {myBalance.balance > 0 ? "+" : ""}{formatVND(myBalance.balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {myBalance.balance > 0
                  ? "Bạn đang được nợ"
                  : myBalance.balance < 0
                  ? "Bạn đang nợ"
                  : "Hạch toán sạch!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="expenses">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-auto sm:h-9">
          <TabsTrigger value="expenses" className="gap-1 text-xs sm:text-sm">
            <Receipt className="h-3.5 w-3.5" />
            Hoá đơn
            {pendingExpenses.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                {pendingExpenses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="debts" className="gap-1 text-xs sm:text-sm">
            <ArrowRight className="h-3.5 w-3.5" />
            Dư nợ
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            Thành viên
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs sm:text-sm">
            Cài đặt
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-4 space-y-3">
          {group.expenses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-3">Chưa có hoá đơn nào</p>
                <Button asChild size="sm">
                  <Link href={`/groups/${id}/expenses/new`}>Thêm hoá đơn đầu tiên</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            group.expenses.map((expense) => (
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
                        <span className="font-medium text-foreground">
                          {expense.paidBy.displayName}
                        </span>{" "}
                        • {formatDate(expense.date)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {expense.splits.map((split) => (
                          <span
                            key={split.id}
                            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                              split.isPaid
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {split.user.displayName}: {formatVND(split.amount)}
                            {split.isPaid && " ✓"}
                          </span>
                        ))}
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
            ))
          )}
        </TabsContent>

        {/* Debts Tab */}
        <TabsContent value="debts" className="mt-4">
          <SettlementSection
            debts={debts}
            groupId={id}
            currentUserId={userId}
            owner={{
              id: group.ownerId,
              displayName: group.owner.displayName,
              bankName: group.owner.bankName,
              accountNumber: group.owner.accountNumber,
              accountName: group.owner.accountName,
            }}
            members={group.members.map((m) => ({
              userId: m.userId,
              user: {
                id: m.user.id,
                displayName: m.user.displayName,
                bankName: m.user.bankName,
                accountNumber: m.user.accountNumber,
                accountName: m.user.accountName,
                sepayWebhookSecret: m.user.sepayWebhookSecret,
              },
            }))}
            settlements={group.settlements.map(s => ({
              id: s.id,
              fromUserId: s.fromUserId,
              fromUserName: s.fromUser.displayName,
              toUserId: s.toUserId,
              toUserName: s.toUser.displayName,
              amount: s.amount,
              isConfirmed: s.isConfirmed,
              createdAt: s.createdAt.toISOString(),
              note: s.note,
            }))}
            expenses={approvedExpenses.map(e => ({
              id: e.id,
              title: e.title,
              amount: e.amount,
              paidById: e.paidById,
              date: e.date.toISOString(),
              splits: e.splits.map(s => ({
                userId: s.userId,
                amount: s.amount,
              })),
              category: e.category,
            }))}
          />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Thành viên ({group.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(member.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.user.displayName}</p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>@{member.user.username}</p>
                      {member.user.bankName && (
                        <p className="text-[11px] text-foreground font-medium bg-muted/50 px-2 py-0.5 rounded inline-block font-mono">
                          🏦 {member.user.bankName} • {member.user.accountNumber} • {member.user.accountName}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.role === "OWNER" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Crown className="h-3 w-3" />
                      Owner
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {isOwner && (
            <AddMemberForm groupId={id} />
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <InviteSection inviteUrl={inviteUrl} inviteCode={group.inviteCode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
