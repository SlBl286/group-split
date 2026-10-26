import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateGroupExpensesWorkbook } from "@/lib/excel-export";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const userId = session.user.id;

    // Verify group existence and membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
    }

    const isMember = group.members.some((m) => m.userId === userId && !m.isLeft);
    if (!isMember) {
      return NextResponse.json({ error: "Bạn không có quyền truy cập nhóm này" }, { status: 403 });
    }

    // Parse filters
    const searchParams = request.nextUrl.searchParams;
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const categoryId = searchParams.get("categoryId");
    const paidById = searchParams.get("paidById");
    const fundingSource = searchParams.get("fundingSource");

    const whereClause: any = {
      groupId,
      status: "APPROVED",
    };

    if (fromStr || toStr) {
      whereClause.date = {};
      if (fromStr) {
        const fromDate = new Date(fromStr);
        fromDate.setHours(0, 0, 0, 0);
        whereClause.date.gte = fromDate;
      }
      if (toStr) {
        const toDate = new Date(toStr);
        toDate.setHours(23, 59, 59, 999);
        whereClause.date.lte = toDate;
      }
    }

    if (categoryId && categoryId !== "ALL") {
      whereClause.categoryId = categoryId;
    }

    if (paidById && paidById !== "ALL") {
      whereClause.paidById = paidById;
    }

    if (fundingSource && fundingSource !== "ALL") {
      whereClause.fundingSource = fundingSource;
    }

    // Query expenses
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        paidBy: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Generate Excel Buffer
    const buffer = await generateGroupExpensesWorkbook({
      group: {
        id: group.id,
        name: group.name,
        currency: group.currency,
      },
      dateRange: {
        from: fromStr,
        to: toStr,
      },
      expenses: expenses.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        amount: e.amount,
        date: e.date,
        category: e.category,
        fundingSource: e.fundingSource,
        paidBy: e.paidBy,
        splits: e.splits.map((s) => ({
          amount: s.amount,
          user: s.user,
        })),
      })),
      members: group.members.filter((m) => !m.isLeft),
    });

    // Generate safe filename
    const sanitizedGroupName = group.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const dateSuffix = fromStr && toStr
      ? `${fromStr}_${toStr}`
      : format(new Date(), "yyyyMMdd_HHmm");
    const filename = `BaoCao_${sanitizedGroupName}_${dateSuffix}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[ExportExcel] Lỗi xuất excel:", err);
    return NextResponse.json({ error: "Lỗi tạo file Excel: " + err.message }, { status: 500 });
  }
}
