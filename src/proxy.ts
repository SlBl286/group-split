import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse, NextRequest } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-jwt";

const { auth } = NextAuth(authConfig);

const authHandler = auth(async (req) => {
  const { pathname } = req.nextUrl;

  // OWASP Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ];

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

  if (isApiAuth || isStaticFile) return response;
  if (isPublicRoute || isInviteRoute || isWebhookRoute || isUploadsRoute) {
    return response;
  }

  // Check Bearer Token from Mobile App
  const authHeader = req.headers.get("authorization");
  let mobileUser: any = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const payload = await verifyMobileToken(token);
    if (payload && payload.tokenType === "access") {
      mobileUser = payload;
    }
  }

  const isLoggedIn = !!req.auth || !!mobileUser;
  const user = (req.auth?.user as any) || mobileUser;

  // Yêu cầu đăng nhập cho tất cả các đường dẫn riêng tư
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Bảo vệ đường dẫn Admin và zalo-helper (Chỉ cho phép Admin hoặc user qy286)
  const isAdmin = user?.username === "qy286" || user?.role === "ADMIN";
  const isAdminOnlyRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/zalo-helper");

  if (isAdminOnlyRoute && !isAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên (qy286)!" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return response;
});

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CRITICAL: NextAuth v5's internal `auth(...)` middleware intercepts all `/api/auth/*`
  // requests before application code. Custom mobile endpoints (e.g. `/api/auth/mobile/*`
  // and `/api/mobile/*`) MUST bypass NextAuth middleware so Auth.js does not reject
  // them with 400 "Bad request." for unrecognized actions!
  if (pathname.startsWith("/api/auth/mobile") || pathname.startsWith("/api/mobile")) {
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    return response;
  }

  return (authHandler as any)(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|logo.ico).*)",
  ],
};
