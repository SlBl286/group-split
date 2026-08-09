import { NextResponse } from "next/server";
import { zaloWebhookLogStore } from "@/lib/zalo-log-store";

export async function GET() {
  const logs = zaloWebhookLogStore.getAll();
  return NextResponse.json({
    success: true,
    totalLogs: logs.length,
    logs,
  });
}

export async function DELETE() {
  zaloWebhookLogStore.clear();
  return NextResponse.json({
    success: true,
    message: "Cleared all webhook logs",
  });
}
