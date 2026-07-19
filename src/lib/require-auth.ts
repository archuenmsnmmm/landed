import { NextResponse } from "next/server";
import {
  assertMatchingUserId,
  verifyAuthenticatedRequest,
  type AuthResult,
} from "@/lib/api-auth";

type AuthSuccess = Extract<AuthResult, { ok: true }>;

export async function requireAuth(
  request: Request,
): Promise<AuthSuccess | NextResponse> {
  const auth = await verifyAuthenticatedRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return auth;
}

export async function requireAuthForUser(
  request: Request,
  userId: string,
): Promise<AuthSuccess | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const match = assertMatchingUserId(auth, userId);
  if (!match.ok) {
    return NextResponse.json({ error: match.error }, { status: match.status });
  }

  return auth;
}
