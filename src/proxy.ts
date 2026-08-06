import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);
  const isInviteRoute = pathname.startsWith("/groups/join/");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isWebhookRoute = pathname.startsWith("/api/webhook/");
  const isUploadsRoute = pathname.startsWith("/uploads/");
  const isStaticFile =
    pathname.startsWith("/logo.") ||
    pathname.startsWith("/favicon.") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg");

  // Bỏ qua xác thực cho api auth, static assets, các routes công khai, webhook từ sepay và các tệp tải lên
  if (isApiAuth || isStaticFile) return NextResponse.next();
  if (isPublicRoute || isInviteRoute || isWebhookRoute || isUploadsRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    // Trả về JSON 401 đối với các API endpoints thay vì redirect sang HTML trang /login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|logo.ico).*)",
  ],
};
