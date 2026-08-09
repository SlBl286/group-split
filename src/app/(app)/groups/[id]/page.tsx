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
import Link from "next/link";
import {
  Plus,
  Crown,
  Receipt,
  Users,
  CheckCircle2,
  Clock,
  Settings,
} from "lucide-react";
import { InviteSection } from "@/components/groups/invite-section";
import { AddMemberForm } from "@/components/groups/add-member-form";
import { ExpenseApproveButton } from "@/components/groups/expense-approve-button";
import { SettlementSection } from "@/components/groups/settlement-section";
import { ExpensesList } from "@/components/groups/expenses-list";
import { GroupBalanceSummary } from "@/components/groups/group-balance-summary";
import { FundManagerSettings } from "@/components/groups/fund-manager-settings";
import { FundAllocationTrigger } from "@/components/groups/fund-allocation-trigger";
import { MemberQRAction } from "@/components/groups/member-qr-action";
import { GroupSettingsForm } from "@/components/groups/group-settings-form";
import { LeaveGroupCard } from "@/components/groups/leave-group-card";

async function getGroupDetail(id: string) {
  try {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        owner: true,
        fundManager: true,
        members: {
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        },
        expenses: {
          include: {
            paidBy: true,
            createdBy: true,
            splits: { include: { user: true } },
            categoryRel: true,
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
  } catch (err) {
    console.error("[GroupDetailPage] Fallback query without categoryRel:", err);
    return await prisma.group.findUnique({
      where: { id },
      include: {
        owner: true,
        fundManager: true,
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
  }
}

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

  const group = await getGroupDetail(id);

  if (!group) notFound();

  const activeMember = group.members.find((m) => m.userId === userId && !m.isLeft);
  if (!activeMember) redirect("/groups");

  const isOwner = group.ownerId === userId;
  const isFundManager =
    group.fundManagerId === userId ||
    (group.fundManagerId === null && group.ownerId === userId);
  const approvedExpenses = group.expenses.filter((e) => e.status === "APPROVED");
  const pendingExpenses = group.expenses.filter((e) => e.status === "PENDING");

  const { debts, balances } = calculateDebts(
    approvedExpenses as any,
    group.members as any,
    group.settlements as any,
    group.ownerId,
    group.fundAllocations as any
  );

  const myBalance = balances.find((b) => b.userId === userId);

  const inviteUrl = generateInviteUrl(group.inviteCode);

  const activeMembersCount = group.members.filter((m) => !m.isLeft).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GroupRealtimeListener groupId={id} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={group.avatar || undefined} alt={group.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {getInitials(group.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground text-sm">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FundAllocationTrigger
            groupId={id}
            isFundManager={isFundManager}
            members={group.members.filter((m) => !m.isLeft).map((m) => ({
              userId: m.userId,
              user: {
                id: m.user.id,
                displayName: m.user.displayName,
                avatar: m.user.avatar,
              },
            }))}
          />
          <Button asChild size="lg" className="gap-2 shrink-0 h-11 md:h-12 px-5 md:px-6 text-sm md:text-base font-bold shadow-md rounded-xl">
            <Link href={`/groups/${id}/expenses/new`}>
              <Plus className="h-5 w-5" />
              Tạo hóa đơn
            </Link>
          </Button>
        </div>
      </div>

      {/* Group Balance Summary (Lũy kế & Quỹ nhóm) */}
      <GroupBalanceSummary
        groupId={id}
        currentUserId={userId}
        myBalance={myBalance || { userId, balance: 0 }}
        myDebts={debts.filter((d) => d.fromUserId === userId)}
        myClaims={debts.filter((d) => d.toUserId === userId)}
        members={group.members.filter((m) => !m.isLeft) as any}
        settlements={group.settlements as any}
        expenses={approvedExpenses as any}
        fundAllocations={group.fundAllocations as any}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[480px]">
          <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            Hóa đơn
            {pendingExpenses.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {pendingExpenses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settle" className="gap-1.5 text-xs sm:text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Trả nợ
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            Thành viên
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            Cài đặt
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Expenses List */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Pending Approval Section */}
          {pendingExpenses.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  Hóa đơn chờ duyệt ({pendingExpenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{expense.title}</span>
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                          Chờ duyệt
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatVND(expense.amount)} • Tạo bởi{" "}
                        <span className="font-medium text-foreground">{expense.createdBy.displayName}</span> •{" "}
                        {formatDate(expense.date)}
                      </p>
                    </div>
                    {isOwner && (
                      <ExpenseApproveButton expenseId={expense.id} />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Approved Expenses */}
          <ExpensesList
            groupId={id}
            expenses={approvedExpenses as any}
            currentUserId={userId}
            currentUserName={session!.user.name || ""}
            isOwner={isOwner}
          />
        </TabsContent>

        {/* Tab 2: Settlement Section */}
        <TabsContent value="settle" className="space-y-4">
          <SettlementSection
            groupId={id}
            debts={debts}
            currentUserId={userId}
            owner={{
              id: group.owner.id,
              displayName: group.owner.displayName,
              bankName: group.owner.bankName,
              accountNumber: group.owner.accountNumber,
              accountName: group.owner.accountName,
            }}
            members={group.members.filter((m) => !m.isLeft) as any}
            settlements={group.settlements as any}
            expenses={approvedExpenses as any}
            fundManagerId={group.fundManagerId}
            fundAllocations={group.fundAllocations as any}
          />
        </TabsContent>

        {/* Tab 3: Members Section */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Danh sách thành viên ({activeMembersCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.members.filter((m) => !m.isLeft).map((member) => {
                const memberBalance = balances.find((b) => b.userId === member.userId)?.balance ?? 0;
                const isMemberOwner = member.userId === group.ownerId;
                const isMemberFundManager = group.fundManagerId === member.userId;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={member.user.avatar || undefined} alt={member.user.displayName} />
                        <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                          {getInitials(member.user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm truncate">{member.user.displayName}</p>
                          {isMemberOwner && (
                            <Badge variant="secondary" className="gap-1 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">
                              <Crown className="h-3 w-3" /> Trưởng nhóm
                            </Badge>
                          )}
                          {isMemberFundManager && !isMemberOwner && (
                            <Badge variant="secondary" className="gap-1 text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 shrink-0">
                              Quản lý quỹ
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{member.user.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Thẻ hiển thị số dư lũy kế cá nhân */}
                      <Badge
                        variant={
                          memberBalance > 0.01
                            ? "default"
                            : memberBalance < -0.01
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs font-mono"
                      >
                        {memberBalance > 0.01
                          ? `+${formatVND(memberBalance)}`
                          : memberBalance < -0.01
                          ? formatVND(memberBalance)
                          : "0đ"}
                      </Badge>

                      {/* Nút hành động quét QR cá nhân */}
                      <MemberQRAction member={member.user as any} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Mời & Thêm thành viên */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InviteSection inviteUrl={inviteUrl} inviteCode={group.inviteCode} />
            <AddMemberForm groupId={id} />
          </div>
        </TabsContent>

        {/* Tab 4: Settings Section */}
        <TabsContent value="settings" className="space-y-4">
          {/* Cấu hình Quản lý quỹ */}
          {isOwner && (
            <FundManagerSettings
              groupId={id}
              currentFundManagerId={group.fundManagerId}
              members={group.members.filter((m) => !m.isLeft) as any}
            />
          )}

          {/* Cài đặt Nhóm */}
          {isOwner && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Thông tin & Cài đặt Nhóm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GroupSettingsForm group={group as any} />
              </CardContent>
            </Card>
          )}

          {/* Thẻ Rời khỏi Nhóm */}
          <LeaveGroupCard groupId={id} groupName={group.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
