export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupReportSection } from "@/components/groups/group-report-section";

interface ReportsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportsPageProps) {
  try {
    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
      select: { name: true },
    });
    return {
      title: group ? `Báo cáo thống kê: ${group.name} - GroupSplit` : "Báo cáo thống kê - GroupSplit",
    };
  } catch {
    return { title: "Báo cáo thống kê - GroupSplit" };
  }
}

export default async function GroupReportsPage({ params }: ReportsPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const group = await prisma.group.findUnique({
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
        orderBy: { date: "desc" },
      },
    },
  });

  if (!group) notFound();

  const activeMember = group.members.find((m) => m.userId === userId && !m.isLeft);
  if (!activeMember) redirect("/groups");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/groups" className="hover:text-foreground transition-colors">
          Nhóm
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/groups/${group.id}`} className="hover:text-foreground transition-colors max-w-[160px] truncate">
          {group.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5 text-primary" /> Báo cáo thống kê
        </span>
      </nav>

      {/* Main Report Section */}
      <GroupReportSection
        groupId={group.id}
        groupName={group.name}
        members={group.members.filter((m) => !m.isLeft) as any}
        expenses={group.expenses as any}
        isStandalone={true}
      />
    </div>
  );
}
