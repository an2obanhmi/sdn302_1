import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_sdn392_key";
export const COOKIE_NAME = "sdn392_token";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the current authenticated user from request headers or cookies.
 */
export async function getAuthUser(request?: Request): Promise<TokenPayload | null> {
  // 1. Try Authorization header
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const payload = verifyToken(token);
      if (payload) return payload;
    }
  }

  // 2. Try cookie from next/headers
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      return verifyToken(token);
    }
  } catch {
    // If not in a server component / route handler with cookie access
  }

  // 3. Try parsing cookie header directly if request is provided
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
      if (match && match[1]) {
        return verifyToken(decodeURIComponent(match[1]));
      }
    }
  }

  return null;
}
