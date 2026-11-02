import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id },
      select: { isConfirmed: true },
    });

    if (!settlement) {
      return NextResponse.json({ error: "Không tìm thấy giao dịch" }, { status: 404 });
    }

    return NextResponse.json({ isConfirmed: settlement.isConfirmed });
  } catch (error) {
    console.error("Get settlement status error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
