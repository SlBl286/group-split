import { prisma } from "@/lib/prisma";
import {
  signMobileTokens,
  verifyMobileToken,
  type MobileTokenPayload,
} from "./mobile-jwt";

export { signMobileTokens, verifyMobileToken, type MobileTokenPayload };

export async function getMobileAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  const payload = await verifyMobileToken(token);
  if (!payload || payload.tokenType !== "access") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      role: true,
      email: true,
      isEmailVerified: true,
    },
  });

  return user;
}
