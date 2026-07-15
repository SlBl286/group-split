"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error || "Đăng ký thất bại");
    } else {
      toast.success("Đăng ký thành công! Đang chuyển hướng...");
      router.push("/login");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-card shadow-sm p-6 space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiển thị</Label>
        <Input
          id="displayName"
          name="displayName"
          placeholder="Nguyễn Văn A"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          name="username"
          placeholder="username (không dấu)"
          required
          autoComplete="username"
          pattern="[a-zA-Z0-9_]{3,20}"
          title="3-20 ký tự, chỉ dùng chữ, số và dấu gạch dưới"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          3-20 ký tự, chỉ dùng chữ cái, số và dấu _
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="reg-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Tối thiểu 6 ký tự"
            required
            minLength={6}
            className="h-11 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu"
          required
          className="h-11"
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tạo tài khoản...
          </>
        ) : (
          "Tạo tài khoản"
        )}
      </Button>
    </form>
  );
}
