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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { DebtTrendChart } from "@/components/groups/debt-trend-chart";
import { ExpensesList } from "@/components/groups/expenses-list";
import { GroupBalanceSummary } from "@/components/groups/group-balance-summary";
import { FundManagerSettings } from "@/components/groups/fund-manager-settings";
import { FundAllocationTrigger } from "@/components/groups/fund-allocation-trigger";
import { MemberQRAction } from "@/components/groups/member-qr-action";
import { GroupSettingsForm } from "@/components/groups/group-settings-form";

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
      fundAllocations: {
        include: { fromUser: true, toUser: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) redirect("/groups");

  const isOwner = group.ownerId === userId;
  const isFundManager =
    group.fundManagerId === userId ||
    (group.fundManagerId === null && group.ownerId === userId);
  const approvedExpenses = group.expenses.filter((e) => e.status === "APPROVED");
  const pendingExpenses = group.expenses.filter((e) => e.status === "PENDING");

  const { debts, balances } = calculateDebts(
    approvedExpenses,
    group.members,
    group.settlements,
    group.ownerId,
    group.fundAllocations
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
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border shadow-sm shrink-0">
            {group.avatar && (
              <AvatarImage src={group.avatar} alt={group.name} className="object-cover" />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
              {getInitials(group.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold tracking-tight">{group.name}</h1>
              {isOwner && (
                <Badge variant="secondary" className="gap-1 h-5 text-[10px] px-1.5 font-bold">
                  <Crown className="h-2.5 w-2.5" />
                  Trưởng nhóm
                </Badge>
              )}
            </div>
            {group.description && (
              <p className="text-muted-foreground text-xs">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FundAllocationTrigger
            groupId={id}
            isFundManager={isFundManager}
            members={group.members.map((m) => ({
              userId: m.userId,
              user: {
                id: m.user.id,
                displayName: m.user.displayName,
                avatar: m.user.avatar,
              },
            }))}
          />
          <Button asChild className="gap-2 shrink-0">
            <Link href={`/groups/${id}/expenses/new`}>
              <Plus className="h-4 w-4" />
              Thêm hoá đơn
            </Link>
          </Button>
        </div>
      </div>

      {/* Balance summary */}
      {myBalance && (
        <GroupBalanceSummary
          myBalance={myBalance}
          myDebts={debts.filter((d) => d.fromUserId === userId)}
          members={group.members.map((m) => ({
            userId: m.userId,
            user: {
              id: m.user.id,
              displayName: m.user.displayName,
              bankName: m.user.bankName,
              accountNumber: m.user.accountNumber,
              accountName: m.user.accountName,
              sepayWebhookSecret: m.user.sepayWebhookSecret,
              avatar: m.user.avatar,
            },
          }))}
          groupId={id}
          currentUserId={userId}
          settlements={group.settlements.map((s) => ({
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
        />
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
        <TabsContent value="expenses" className="mt-4">
          <ExpensesList
            expenses={group.expenses.map((e) => ({
              id: e.id,
              title: e.title,
              amount: e.amount,
              splitType: e.splitType,
              status: e.status,
              date: e.date.toISOString(),
              category: e.category,
              paidBy: {
                displayName: e.paidBy.displayName,
              },
              splits: e.splits.map((s) => ({
                id: s.id,
                amount: s.amount,
                isPaid: s.isPaid,
                user: {
                  displayName: s.user.displayName,
                },
              })),
            }))}
            isOwner={isOwner}
            groupId={id}
          />
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
                avatar: m.user.avatar,
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
            fundManagerId={group.fundManagerId}
            fundAllocations={group.fundAllocations.map(fa => ({
              id: fa.id,
              amount: fa.amount,
              note: fa.note,
              date: fa.date.toISOString(),
              fromUserId: fa.fromUserId,
              fromUserName: fa.fromUser.displayName,
              toUserId: fa.toUserId,
              toUserName: fa.toUser.displayName,
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
                    {member.user.avatar && (
                      <AvatarImage src={member.user.avatar} alt={member.user.displayName} className="object-cover" />
                    )}
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
                      Trưởng nhóm
                    </Badge>
                  )}
                  <MemberQRAction member={member} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Biểu đồ xu hướng dư nợ nhóm */}
          <DebtTrendChart
            currentUserId={userId}
            members={group.members.map((m) => ({
              userId: m.userId,
              user: {
                id: m.user.id,
                displayName: m.user.displayName,
              },
            }))}
            settlements={group.settlements.map((s) => ({
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
            expenses={approvedExpenses.map((e) => ({
              id: e.id,
              title: e.title,
              amount: e.amount,
              paidById: e.paidById,
              date: e.date.toISOString(),
              splits: e.splits.map((s) => ({
                userId: s.userId,
                amount: s.amount,
              })),
              category: e.category,
            }))}
          />

          {isOwner && (
            <AddMemberForm groupId={id} />
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <InviteSection inviteUrl={inviteUrl} inviteCode={group.inviteCode} />
          {isOwner && (
            <>
              <GroupSettingsForm
                group={{
                  id,
                  name: group.name,
                  description: group.description,
                  avatar: group.avatar,
                }}
              />
              <FundManagerSettings
                groupId={id}
                members={group.members.map((m) => ({
                  userId: m.userId,
                  user: {
                    id: m.user.id,
                    displayName: m.user.displayName,
                    username: m.user.username,
                  },
                }))}
                currentFundManagerId={group.fundManagerId}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
