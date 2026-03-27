import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ai-videos-jwt-secret-2026";

export function getUserFromRequest(request: NextRequest): { userId: string; phone: string } | null {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}
