import { NextResponse } from "next/server";
import { getStripeConfigStatus } from "@/lib/stripe-config";

export async function GET(request: Request) {
  const adminSecret = process.env.ADMIN_STATUS_SECRET?.trim();
  const provided = request.headers.get("x-admin-secret")?.trim();
  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(getStripeConfigStatus());
}
