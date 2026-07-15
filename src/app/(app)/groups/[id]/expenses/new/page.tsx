import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";

export const metadata = {
  title: "Thêm hoá đơn - GroupSplit",
};

export default async function NewExpensePage({
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
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) redirect("/groups");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thêm hoá đơn</h1>
        <p className="text-muted-foreground text-sm">
          Nhóm: <span className="font-medium text-foreground">{group.name}</span>
        </p>
      </div>

      <AddExpenseForm
        groupId={id}
        members={group.members.map((m) => ({
          userId: m.userId,
          displayName: m.user.displayName,
        }))}
        currentUserId={userId}
      />
    </div>
  );
}
