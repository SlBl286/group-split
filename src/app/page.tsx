import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Receipt,
  Users,
  PieChart,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-6xl mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base">GroupSplit</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

        <Badge variant="secondary" className="mb-4 gap-1">
          <Zap className="h-3 w-3" />
          Miễn phí & dễ dùng
        </Badge>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Chia tiền nhóm, không còn rối nữa
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
          Theo dõi chi tiêu nhóm, chia hoá đơn tự động và biết chính xác ai
          cần trả cho ai — nhanh, gọn, minh bạch.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild className="gap-2">
            <Link href="/register">
              Bắt đầu miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Đã có tài khoản</Link>
          </Button>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            {
              icon: Users,
              title: "Quản lý nhóm",
              desc: "Tạo nhiều nhóm, mời thành viên qua link hoặc username.",
            },
            {
              icon: PieChart,
              title: "Chia hoá đơn linh hoạt",
              desc: "Chia đều hoặc tuỳ chỉnh từng người. Chỉ định ai là người trả.",
            },
            {
              icon: Receipt,
              title: "Theo dõi dư nợ",
              desc: "Biết ngay ai nợ ai bao nhiêu, đánh dấu đã thanh toán.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border bg-card p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GroupSplit. Làm với ❤️ để việc chia tiền dễ hơn.
      </footer>
    </div>
  );
}
