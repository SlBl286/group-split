"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, RefreshCw, Copy, Check, Bot, MessageSquare, AlertCircle, ArrowLeft, Trash2, Code } from "lucide-react";
import Link from "next/link";

interface ExtractedChat {
  chatId: string;
  chatTitle?: string;
  senderName?: string;
  lastMessage?: string;
  date?: string;
  raw: any;
}

export default function ZaloHelperPage() {
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Lưu 100% nguyên văn toàn bộ response gần nhất
  const [lastRawResponse, setLastRawResponse] = useState<any>(null);
  // Tích lũy toàn bộ lịch sử các đối tượng Response thô đã nhận được
  const [responsesHistory, setResponsesHistory] = useState<any[]>([]);
  // Danh sách các Chat ID trích xuất được
  const [chats, setChats] = useState<ExtractedChat[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchUpdates() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/zalo/get-updates", {
        method: "POST",
      });
      const data = await res.json();
      setLoading(false);

      // Lưu nguyên văn response vào biến state
      setLastRawResponse(data);

      // Tích lũy response thô vào mảng lịch sử
      setResponsesHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString("vi-VN"),
          status: res.status,
          response: data,
        },
        ...prev.slice(0, 49), // Giữ tối đa 50 bản ghi lịch sử gần nhất
      ]);

      // Nếu có kết quả result có dữ liệu -> trích xuất Chat ID
      if (data && Array.isArray(data.result) && data.result.length > 0) {
        extractChats(data.result);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg("Lỗi kết nối máy chủ");
    }
  }

  function extractChats(results: any[]) {
    if (!results || results.length === 0) return;

    setChats((prevChats) => {
      const chatMap = new Map<string, ExtractedChat>();

      // Giữ lại tất cả các Chat ID đã trích xuất được từ trước
      for (const c of prevChats) {
        chatMap.set(c.chatId, c);
      }

      for (const item of results) {
        // Parse Telegram/Zalo getUpdates payload structure
        const msg = item.message || item.edited_message || item.channel_post || item;
        const chat = msg?.chat || msg?.recipient || msg?.from;
        const chatId = chat?.id || chat?.chat_id || msg?.chat_id;

        if (chatId) {
          chatMap.set(String(chatId), {
            chatId: String(chatId),
            chatTitle: chat?.title || chat?.name || msg?.chat_name || "Trò chuyện cá nhân / Nhóm",
            senderName: msg?.from?.first_name || msg?.from?.name || msg?.sender?.name || "Thành viên",
            lastMessage: msg?.text || msg?.caption || "[Tin nhắn hình ảnh/tệp]",
            date: msg?.date ? new Date(msg.date * 1000).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN"),
            raw: item,
          });
        }
      }

      return Array.from(chatMap.values());
    });
  }

  // Tự động làm mới mỗi 3 giây nếu bật Auto Refresh
  useEffect(() => {
    if (!autoRefresh) return;
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Đã sao chép Chat ID: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearAllData = () => {
    setChats([]);
    setResponsesHistory([]);
    setLastRawResponse(null);
    toast.success("Đã xóa sạch lịch sử dữ liệu quét");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Bảng điều khiển
        </Link>
        <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono text-xs">
          <Bot className="h-3.5 w-3.5" /> Zalo Bot Helper
        </Badge>
      </div>

      {/* Main Intro Card */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            🤖 Xem nguyên văn Dữ liệu Response Zalo Bot (`getUpdates`)
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Trang này hiển thị **100% nguyên văn toàn bộ phản hồi JSON** từ Zalo Bot API <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">https://bot-api.zaloplatforms.com/bot.../getUpdates</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-card border rounded-xl p-4 text-xs space-y-2 text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              📌 Hướng dẫn lấy Chat ID:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              <li>Mở Zalo và **Thêm Bot** của bạn vào Nhóm chat (hoặc gửi tin nhắn trực tiếp cho Bot).</li>
              <li>Gửi một tin nhắn bất kỳ vào Nhóm Zalo đó (Ví dụ: <span className="font-mono text-foreground font-semibold">ping</span> hoặc <span className="font-mono text-foreground font-semibold">test</span>).</li>
              <li>Bấm nút **"Lấy danh sách tin nhắn (getUpdates)"** bên dưới.</li>
              <li>Xem nguyên văn dữ liệu JSON và copy **Zalo Chat ID** dán vào Cài đặt nhóm!</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={(val) => {
                  setAutoRefresh(val);
                  if (val) toast.info("Đã bật tự động quét mỗi 3 giây");
                }}
              />
              <Label htmlFor="auto-refresh" className="text-xs font-semibold cursor-pointer">
                Tự động quét tin nhắn mới (mỗi 3 giây)
              </Label>
            </div>

            <Button
              onClick={fetchUpdates}
              disabled={loading}
              className="gap-2 font-bold text-xs h-10 px-5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <RefreshCw className="h-4 w-4 text-white" />
              )}
              Lấy danh sách tin nhắn (getUpdates)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert if any */}
      {errorMsg && (
        <Card className="border-rose-500/30 bg-rose-500/10">
          <CardContent className="p-4 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Lỗi truy vấn:</p>
              <p>{errorMsg}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Chat IDs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Danh sách Chat ID trích xuất được ({chats.length})
          </h3>
          {(chats.length > 0 || responsesHistory.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllData}
              className="text-xs text-muted-foreground hover:text-rose-500 h-8 px-2 gap-1 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa sạch danh sách
            </Button>
          )}
        </div>

        {chats.length === 0 ? (
          <Card className="border-dashed text-center p-8">
            <p className="text-xs text-muted-foreground">
              Chưa phát hiện Chat ID nào. Vui lòng gửi tin nhắn vào nhóm Zalo có Bot rồi bấm <b>Lấy danh sách tin nhắn</b>.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {chats.map((chat) => (
              <Card key={chat.chatId} className="border-blue-500/20 hover:border-blue-500/40 transition-colors shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-foreground">{chat.chatTitle}</p>
                      <p className="text-[11px] text-muted-foreground">Người gửi: {chat.senderName}</p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {chat.date}
                    </Badge>
                  </div>

                  <div className="bg-muted/60 p-2.5 rounded-lg space-y-1 font-mono text-xs">
                    <span className="text-[10px] text-muted-foreground block font-sans font-semibold">Zalo Chat ID:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm tracking-wide select-all">
                      {chat.chatId}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground italic truncate">
                    &quot;{chat.lastMessage}&quot;
                  </div>

                  <Button
                    onClick={() => copyToClipboard(chat.chatId)}
                    className="w-full gap-2 text-xs font-bold h-9 cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {copiedId === chat.chatId ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        Đã sao chép Chat ID!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-white" />
                        Sao chép Chat ID ({chat.chatId})
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Latest Raw Response */}
      {lastRawResponse && (
        <Card className="border">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold font-mono text-foreground flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-500" />
              Nguyên văn Phản hồi JSON Gần nhất (Latest Raw Response)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {lastRawResponse.error_code === 408 || lastRawResponse.status === 408
                ? "🟡 HTTP 408 Timeout"
                : lastRawResponse.ok
                ? "🟢 HTTP 200 OK"
                : "🔴 Response Error"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <pre className="bg-muted/80 p-3 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-80 select-all">
              {JSON.stringify(lastRawResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Full Response History */}
      {responsesHistory.length > 0 && (
        <Card className="border">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold font-mono text-muted-foreground flex items-center gap-2">
              Lịch sử Tất cả các Response Thô ({responsesHistory.length} lần quét)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <pre className="bg-muted/60 p-3 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-96 select-all">
              {JSON.stringify(responsesHistory, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
