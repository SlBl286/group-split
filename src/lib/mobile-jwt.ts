import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "group-split-mobile-secret-key-32-chars-long!"
);

export interface MobileTokenPayload {
  id: string;
  username: string;
  role: string;
  name: string;
  email?: string | null;
}

export async function signMobileTokens(user: {
  id: string;
  username: string;
  role: string;
  displayName: string;
  email?: string | null;
}) {
  const payload: MobileTokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.displayName,
    email: user.email,
  };

  // Access Token: 30 days for mobile convenience
  const accessToken = await new SignJWT({ ...payload, tokenType: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  // Refresh Token: 180 days
  const refreshToken = await new SignJWT({ id: user.id, tokenType: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
}

export async function verifyMobileToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as MobileTokenPayload & { tokenType: string };
  } catch (err) {
    return null;
  }
}

