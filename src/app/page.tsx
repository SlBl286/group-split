import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/format";
import {
  Users,
  PieChart,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  QrCode,
  Coins,
  Sparkles,
  LayoutDashboard,
  Smartphone,
  Bell,
  Lock,
  ShieldCheck,
  Download,
  Receipt,
  Check,
  FileText,
  Mail,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "GroupSplit - Chia tiền nhóm dễ dàng | Sắp có trên Android & iOS",
  description:
    "Ứng dụng chia tiền nhóm, quản lý quỹ và thanh toán VietQR thông minh. Sắp ra mắt phiên bản ứng dụng di động trên Google Play và App Store.",
};

export default async function LandingPage() {
  const session = await auth();
  let dbUser = null;

  if (session?.user?.id) {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-6xl mx-auto items-center justify-between px-4">
          <BrandLogo size="md" href="/" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="#mobile-app"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile App
            </Link>

            <ThemeToggle />

            {dbUser ? (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild className="hidden sm:flex gap-1.5 font-semibold">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    Vào Dashboard
                  </Link>
                </Button>
                <Link href="/settings">
                  <Avatar className="h-8 w-8 border shadow-sm cursor-pointer hover:opacity-85 transition-opacity">
                    {dbUser.avatar && (
                      <AvatarImage src={dbUser.avatar} alt={dbUser.displayName} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(dbUser.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="font-medium text-xs sm:text-sm">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild className="font-semibold shadow-md shadow-primary/10 text-xs sm:text-sm">
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center px-4 pt-16 pb-16 md:py-24 relative overflow-hidden max-w-6xl mx-auto w-full">
          {/* Background decorative glows */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-36 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Mobile Launch Announcement Badge */}
          <Link
            href="#mobile-app"
            className="group mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur transition-all hover:bg-primary/20 hover:border-primary/50 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <Smartphone className="h-3.5 w-3.5" />
            <span>Sắp ra mắt trên Google Play &amp; App Store</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
            Chia tiền nhóm thông minh <br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Không còn nỗi lo tính toán
            </span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
            Tự động phân bổ hóa đơn, quản lý quỹ chung và thanh toán chuyển khoản qua mã VietQR một chạm. Trải nghiệm liền mạch trên nền tảng Web và ứng dụng di động sắp ra mắt.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
            {dbUser ? (
              <Button size="lg" asChild className="gap-2 px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all">
                <Link href="/dashboard">
                  Vào Dashboard ứng dụng
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="gap-2 px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all">
                  <Link href="/register">
                    Trải nghiệm miễn phí ngay
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="px-8 py-6 text-base font-semibold bg-background/50">
                  <Link href="/login">Đăng nhập tài khoản</Link>
                </Button>
              </>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-16 py-6 border-y w-full grid grid-cols-2 md:grid-cols-4 gap-6 bg-muted/20 rounded-2xl px-6">
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-extrabold text-primary">100%</h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Bảo mật &amp; Minh bạch</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-extrabold text-blue-500">0đ</h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Hoàn toàn miễn phí</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-extrabold text-indigo-500">VietQR</h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Chuyển khoản 1 chạm</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl sm:text-3xl font-extrabold text-emerald-500">Mobile Ready</h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Android &amp; iOS</p>
            </div>
          </div>
        </section>

        {/* SECTION: Mobile App Showcase (SẮP RA MẮT TRÊN GOOGLE PLAY & APP STORE) */}
        <section id="mobile-app" className="w-full py-20 px-4 bg-muted/30 border-y relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Text & Badges */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="h-3.5 w-3.5" />
                  Sắp có mặt trên thiết bị di động
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  GroupSplit Mobile <br />
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Mang cả chuyến đi vào túi áo
                  </span>
                </h2>

                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Không cần mở laptop hay trình duyệt, phiên bản di động cho phép bạn ghi nhanh hóa đơn ngay tại quán ăn, tự động tính tiền cho từng bạn bè và quét mã VietQR để nhận tiền trả nợ ngay lập tức.
                </p>

                {/* Mobile Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-card/60 backdrop-blur">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Thông báo đẩy tức thì</h4>
                      <p className="text-xs text-muted-foreground">Nhận tin báo ngay khi có chi tiêu mới hoặc bạn bè vừa thanh toán nợ.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-card/60 backdrop-blur">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <QrCode className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Quét VietQR 1 chạm</h4>
                      <p className="text-xs text-muted-foreground">Mở app ngân hàng và chuyển khoản chính xác tới từng đồng trong nháy mắt.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-card/60 backdrop-blur">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Nhanh &amp; Tiết kiệm pin</h4>
                      <p className="text-xs text-muted-foreground">Tối ưu mượt mà cho cả Android và iOS, đồng bộ dữ liệu ngay lập tức.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-card/60 backdrop-blur">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Bảo mật thiết bị</h4>
                      <p className="text-xs text-muted-foreground">Quản lý các thiết bị đăng nhập, thu hồi quyền từ xa an toàn.</p>
                    </div>
                  </div>
                </div>

                {/* App Store / Google Play Badges with Coming Soon */}
                <div className="pt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sắp phát hành chính thức trên:
                  </p>
                  <div className="flex flex-wrap gap-3.5 items-center">
                    {/* Google Play Store Badge */}
                    <div className="relative group">
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-card/80 shadow-sm border-border">
                        {/* Google Play SVG Icon */}
                        <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path fill="#4285F4" d="M3.6 1.8L13.8 12 3.6 22.2c-.4-.4-.6-.9-.6-1.5V3.3c0-.6.2-1.1.6-1.5z" />
                          <path fill="#34A853" d="M17.2 8.6L13.8 12l3.4 3.4 4.1-2.3c.7-.4.7-1.7 0-2.1l-4.1-2.4z" />
                          <path fill="#FBBC05" d="M13.8 12L3.6 1.8c.6-.4 1.4-.4 2.1 0l11.5 6.8L13.8 12z" />
                          <path fill="#EA4335" d="M13.8 12l3.4 3.4-11.5 6.8c-.7.4-1.5.4-2.1 0L13.8 12z" />
                        </svg>
                        <div className="text-left">
                          <div className="text-[10px] leading-tight text-muted-foreground uppercase font-semibold">TẢI TỪ</div>
                          <div className="text-xs sm:text-sm font-bold leading-tight">Google Play</div>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-[10px] font-semibold bg-primary/10 text-primary border-none">
                          Sắp ra mắt
                        </Badge>
                      </div>
                    </div>

                    {/* Apple App Store Badge */}
                    <div className="relative group">
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-card/80 shadow-sm border-border">
                        {/* Apple SVG Icon */}
                        <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.35-.58.65-1.09 1.72-.95 2.74 1 .08 2.04-.49 2.66-1.24z" />
                        </svg>
                        <div className="text-left">
                          <div className="text-[10px] leading-tight text-muted-foreground uppercase font-semibold">TẢI TỪ</div>
                          <div className="text-xs sm:text-sm font-bold leading-tight">App Store</div>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                          Sắp ra mắt
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    Ứng dụng đang hoàn thiện các thủ tục xét duyệt trên Cửa hàng Google Play &amp; Apple Store. Hiện bạn có thể đăng ký tài khoản và trải nghiệm đầy đủ trên Web!
                  </p>
                </div>
              </div>

              {/* Right Column: Sleek Phone Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[290px] sm:max-w-[320px] rounded-[2.5rem] p-3.5 bg-neutral-900 border-4 border-neutral-700/80 shadow-2xl shadow-primary/10">
                  {/* Phone Notch / Island */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-950 rounded-full z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  </div>

                  {/* Phone Screen */}
                  <div className="relative rounded-[2rem] overflow-hidden bg-background border p-4 pt-9 flex flex-col space-y-3.5 text-xs select-none">
                    {/* App Header in Mobile */}
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span>GroupSplit Mobile</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                        Real-time
                      </div>
                    </div>

                    {/* Trip Group Card */}
                    <div className="rounded-xl bg-gradient-to-br from-primary/15 via-blue-500/10 to-indigo-500/10 border p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Chuyến Đi Đà Lạt 🌿</span>
                        <span className="text-[10px] text-muted-foreground">4 thành viên</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Tổng chi tiêu nhóm</div>
                        <div className="text-base font-extrabold text-primary">3.250.000 đ</div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Bạn cần nhận lại:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">+420.000 đ</span>
                      </div>
                    </div>

                    {/* Expense Items in Mockup */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Khoản chi gần nhất
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-card border">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-[11px] leading-tight">Lẩu gà lá é</div>
                            <div className="text-[9px] text-muted-foreground">Tuấn Anh đã trả</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[11px]">450.000 đ</div>
                          <div className="text-[9px] text-emerald-500 font-medium">Chia 4 người</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-card border">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <QrCode className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div>
                            <div className="font-semibold text-[11px] leading-tight">Vé cáp treo đồi chè</div>
                            <div className="text-[9px] text-muted-foreground">Minh Hoàng đã trả</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[11px]">320.000 đ</div>
                          <div className="text-[9px] text-blue-500 font-medium">VietQR</div>
                        </div>
                      </div>
                    </div>

                    {/* Push Notification Mockup Banner */}
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="text-[10px] leading-tight text-foreground">
                        <span className="font-bold">Minh vừa chuyển 120.000 đ</span>
                        <div className="text-muted-foreground text-[9px]">Xác nhận tức thời qua SePay VietQR</div>
                      </div>
                    </div>

                    {/* Bottom CTA in Mockup */}
                    <div className="pt-1">
                      <div className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-center text-[11px] shadow-sm flex items-center justify-center gap-1.5">
                        <QrCode className="h-3.5 w-3.5" />
                        Quét mã VietQR thanh toán
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Features Showcase Grid */}
        <section className="py-20 px-4 max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Tính năng nổi bật chuyên biệt
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Thiết kế tinh gọn, tập trung hoàn toàn vào trải nghiệm chia sẻ hóa đơn nhóm thực tế của bạn bè và đồng nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Feature 1 */}
            <div className="rounded-2xl border bg-card/50 backdrop-blur p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-base mb-2">Chia hóa đơn linh hoạt</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Hỗ trợ chia đều cho cả nhóm hoặc chia riêng biệt từng người theo <strong>Số tiền cụ thể</strong> hoặc <strong>Tỷ lệ phần trăm (%)</strong> tùy chỉnh.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border bg-card/50 backdrop-blur p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-base mb-2">Quản lý quỹ nhóm</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Cấp tiền quỹ hàng ngày/tuần cho thành viên ăn chung hoặc ăn riêng. Hệ thống tự động tính toán dư nợ và cấn trừ thông minh.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border bg-card/50 backdrop-blur p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="font-bold text-base mb-2">Quét mã VietQR</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tự động sinh mã VietQR chuyển khoản kèm nội dung mã hóa đơn. Xác thực thanh toán tự động qua kết nối SePay.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border bg-card/50 backdrop-blur p-6 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-bold text-base mb-2">Real-time đa nền tảng</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Đồng bộ hóa tức thì các hóa đơn mới, thay đổi quỹ, hay trạng thái xác nhận chuyển khoản mà không cần làm mới trang.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: 3 Steps How it Works */}
        <section className="py-16 px-4 max-w-6xl mx-auto w-full border-t">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
              Đơn giản &amp; Nhanh chóng
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Quy trình chia tiền trong 3 bước</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="p-6 rounded-2xl border bg-card/40 space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-base">
                1
              </div>
              <h3 className="font-bold text-base">Tạo nhóm &amp; Mời bạn bè</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tạo nhóm đi chơi, du lịch hoặc chi tiêu gia đình. Chia sẻ mã mời qua Zalo hoặc link nhóm nhanh chóng.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/40 space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 font-extrabold flex items-center justify-center text-base">
                2
              </div>
              <h3 className="font-bold text-base">Ghi chép các khoản chi</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ai trả tiền thì người đó nhập hoặc chụp ảnh hóa đơn. Chọn người cùng tham gia chia tiền chỉ trong vài giây.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-card/40 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-base">
                3
              </div>
              <h3 className="font-bold text-base">Quét VietQR &amp; Quyết toán</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống tự tối ưu số giao dịch cần chuyển. Quét mã VietQR chuyển khoản chính xác, tiền về thẳng tài khoản ngân hàng.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 text-muted-foreground bg-muted/10">
        <div className="container max-w-6xl mx-auto px-4 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Bio */}
            <div className="md:col-span-2 space-y-3">
              <BrandLogo size="md" href="/" />
              <p className="text-xs max-w-sm leading-relaxed">
                GroupSplit - Ứng dụng quản lý chi tiêu nhóm, phân bổ hóa đơn ăn uống và du lịch thông minh, minh bạch và hoàn toàn miễn phí.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Tuân thủ Chính sách dữ liệu người dùng Google Play</span>
              </div>
            </div>

            {/* Col 2: Sản phẩm */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Sản phẩm</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                    Dashboard Web App
                  </Link>
                </li>
                <li>
                  <Link href="#mobile-app" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>Ứng dụng Mobile</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-none">
                      Sắp có
                    </Badge>
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-primary transition-colors">
                    Đăng ký miễn phí
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Đăng nhập tài khoản
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Pháp lý & Chính sách */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Pháp lý &amp; Quyền riêng tư</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Chính sách quyền riêng tư
                  </Link>
                </li>
                <li>
                  <Link href="/privacy#section-6" className="hover:text-primary transition-colors">
                    Yêu cầu xóa tài khoản &amp; Dữ liệu
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@qy286.me" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    support@qy286.me
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} GroupSplit. Made with ❤️ to simplify expense sharing.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:underline">
                Chính sách bảo mật (Privacy Policy)
              </Link>
              <Link href="/chinh-sach-quyen-rieng-tu" className="hover:underline">
                Bảo vệ dữ liệu
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
