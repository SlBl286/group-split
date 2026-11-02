import { auth } from "@/auth";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string;
  role: string;
  email?: string | null;
  isAdmin?: boolean;
}

export async function getAuthUser(req?: Request): Promise<AuthenticatedUser | null> {
  // 1. Check Mobile Bearer Token if request is passed or has Authorization header
  if (req) {
    const mobileUser = await getMobileAuthUser(req);
    if (mobileUser) {
      return {
        id: mobileUser.id,
        name: mobileUser.displayName,
        username: mobileUser.username,
        role: mobileUser.role,
        email: mobileUser.email,
        isAdmin: mobileUser.username === "qy286" || mobileUser.role === "ADMIN",
      };
    }
  } else {
    try {
      const { headers } = await import("next/headers");
      const headerList = await headers();
      const authHeader = headerList.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const dummyReq = new Request("http://localhost", {
          headers: { authorization: authHeader },
        });
        const mobileUser = await getMobileAuthUser(dummyReq);
        if (mobileUser) {
          return {
            id: mobileUser.id,
            name: mobileUser.displayName,
            username: mobileUser.username,
            role: mobileUser.role,
            email: mobileUser.email,
            isAdmin: mobileUser.username === "qy286" || mobileUser.role === "ADMIN",
          };
        }
      }
    } catch (_) {}
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        name: session.user.name || "",
        username: (session.user as any).username || "",
        role: (session.user as any).role || "USER",
        email: session.user.email,
        isAdmin: (session.user as any).isAdmin || (session.user as any).role === "ADMIN",
      };
    }
  } catch (_) {}

  return null;
}

