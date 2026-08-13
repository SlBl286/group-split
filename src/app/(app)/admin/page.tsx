"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ShieldCheck,
  Users,
  Mail,
  Send,
  Loader2,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  XCircle,
  Receipt,
  Building2,
  Bot,
  Search,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  isEmailVerified: boolean;
  role: "ADMIN" | "USER";
  createdAt: string;
  _count: {
    groupMemberships: number;
    paidExpenses: number;
  };
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalExpenses: 0,
    totalSettlements: 0,
  });

  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    user: "",
    pass: "",
    from: "",
    secure: false,
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Lấy thông tin admin stats & SMTP
  async function fetchAdminData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setStats(data.stats);
        setSmtp({
          host: data.smtp.host || "",
          port: String(data.smtp.port || "587"),
          user: data.smtp.user || "",
          pass: data.smtp.pass || "",
          from: data.smtp.from || "",
          secure: data.smtp.secure === "true",
        });
      } else {
        toast.error(data.error || "Không thể tải dữ liệu Admin");
      }
    } catch (err) {
      setLoading(false);
    }
  }

  // Lấy danh sách người dùng
  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  }

  useEffect(() => {
    fetchAdminData();
    fetchUsers();
  }, []);

  // Lưu cấu hình SMTP
  async function handleSaveSmtp(e: React.FormEvent) {
    e.preventDefault();
    setSavingSmtp(true);

    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtp),
      });

      const data = await res.json();
      setSavingSmtp(false);

      if (res.ok) {
        toast.success(data.message || "Đã lưu cấu hình SMTP!");
      } else {
        toast.error(data.error || "Lưu cấu hình thất bại");
      }
    } catch (err) {
      setSavingSmtp(false);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  // Gửi Email thử nghiệm
  async function handleTestEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmailAddr) {
      toast.error("Vui lòng nhập Email người nhận thử nghiệm");
      return;
    }

    setTestingEmail(true);
    try {
      const res = await fetch("/api/admin/system/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testEmailAddr }),
      });

      const data = await res.json();
      setTestingEmail(false);

      if (res.ok) {
        toast.success(data.message || "Gửi Email thử nghiệm thành công!");
      } else {
        toast.error(data.error || "Gửi Email thử nghiệm thất bại");
      }
    } catch (err) {
      setTestingEmail(false);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  // Thao tác Admin trên tài khoản người dùng
  async function handleUpdateUser(userId: string, updatePayload: any) {
    setUpdatingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updatePayload }),
      });

      const data = await res.json();
      setUpdatingUserId(null);

      if (res.ok) {
        toast.success(data.message || "Cập nhật thành công!");
        fetchUsers();
      } else {
        toast.error(data.error || "Thao tác thất bại");
      }
    } catch (err) {
      setUpdatingUserId(null);
      toast.error("Lỗi máy chủ");
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-rose-600" />
            <h1 className="text-2xl font-bold tracking-tight">Hệ thống Quản trị Admin (`qy286`)</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Quản lý cấu hình Email SMTP xác nhận, tài khoản người dùng và bảo mật hệ thống.
          </p>
        </div>
        <Button onClick={fetchAdminData} variant="outline" size="sm" className="gap-1.5 shrink-0 font-semibold">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* System Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Người dùng</p>
              <p className="text-xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Nhóm chia tiền</p>
              <p className="text-xl font-bold">{stats.totalGroups}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Hóa đơn tạo</p>
              <p className="text-xl font-bold">{stats.totalExpenses}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Thanh toán</p>
              <p className="text-xl font-bold">{stats.totalSettlements}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smtp" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <Mail className="h-4 w-4 text-blue-500" /> Cấu hình Email SMTP
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <Users className="h-4 w-4 text-purple-500" /> Quản lý Người dùng
          </TabsTrigger>
          <TabsTrigger value="zalo" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <Bot className="h-4 w-4 text-emerald-500" /> Zalo Inspector
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Cấu hình SMTP */}
        <TabsContent value="smtp" className="space-y-4">
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Cấu hình Máy chủ Gửi Email SMTP
              </CardTitle>
              <CardDescription className="text-xs">
                Email này sẽ được sử dụng để gửi mã OTP xác thực đăng ký và khôi phục mật khẩu cho thành viên.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSaveSmtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      value={smtp.port}
                      onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                      required
                      className="h-11 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP User / Email đăng nhập</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      placeholder="your-email@gmail.com"
                      value={smtp.user}
                      onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password / Mật khẩu ứng dụng</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      placeholder="••••••••••••"
                      value={smtp.pass}
                      onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpFrom">Email Người gửi (From Header)</Label>
                  <Input
                    id="smtpFrom"
                    placeholder="GroupSplit App <no-reply@yourdomain.com>"
                    value={smtp.from}
                    onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Switch
                    id="smtpSecure"
                    checked={smtp.secure}
                    onCheckedChange={(val) => setSmtp({ ...smtp, secure: val })}
                  />
                  <Label htmlFor="smtpSecure" className="text-xs font-semibold cursor-pointer">
                    Sử dụng kết nối bảo mật SSL/TLS (Cổng 465)
                  </Label>
                </div>

                <Button type="submit" disabled={savingSmtp} className="font-bold gap-2 h-11 bg-blue-600 hover:bg-blue-700">
                  {savingSmtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Lưu Cấu hình SMTP Email
                </Button>
              </form>

              {/* Form Gửi thử nghiệm */}
              <div className="pt-6 border-t space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-emerald-500" />
                  Gửi Email Thử nghiệm (Test SMTP)
                </h4>

                <form onSubmit={handleTestEmail} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="Nhập email người nhận thử nghiệm..."
                    value={testEmailAddr}
                    onChange={(e) => setTestEmailAddr(e.target.value)}
                    required
                    className="h-11 flex-1"
                  />
                  <Button type="submit" disabled={testingEmail} variant="outline" className="h-11 font-semibold gap-1.5">
                    {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-emerald-500" />}
                    Gửi Email Test
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Quản lý Người dùng */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border">
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Danh sách Người dùng ({users.length})
                  </CardTitle>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, username, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                      <th className="p-3">Tài khoản</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Quyền</th>
                      <th className="p-3">Xác thực Email</th>
                      <th className="p-3">Ngày tạo</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground">{u.displayName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">@{u.username}</div>
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{u.email || "Chưa có"}</td>
                        <td className="p-3">
                          {u.username === "qy286" || u.role === "ADMIN" ? (
                            <Badge className="bg-rose-500 text-white font-bold text-[10px]">
                              ADMIN
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              USER
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                              <XCircle className="h-3.5 w-3.5" /> Chưa xác thực
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {!u.isEmailVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUser(u.id, { isEmailVerified: true })}
                              disabled={updatingUserId === u.id}
                              className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-500/30"
                            >
                              Kích hoạt Email
                            </Button>
                          )}
                          {u.username !== "qy286" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateUser(u.id, {
                                  role: u.role === "ADMIN" ? "USER" : "ADMIN",
                                })
                              }
                              disabled={updatingUserId === u.id}
                              className="h-7 text-[10px] px-2"
                            >
                              {u.role === "ADMIN" ? "Gỡ Admin" : "Thành Admin"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Zalo Bot Inspector */}
        <TabsContent value="zalo" className="space-y-4">
          <Card className="border bg-blue-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Bot className="h-5 w-5" />
                Zalo Bot Realtime Inspector (`/zalo-helper`)
              </CardTitle>
              <CardDescription className="text-xs">
                Trang kiểm tra Webhook Zalo Bot dành riêng cho Quản trị viên (ADMIN).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="gap-2 font-bold bg-blue-600 hover:bg-blue-700">
                <Link href="/zalo-helper">
                  Mở trang Zalo Bot Inspector ngay
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
