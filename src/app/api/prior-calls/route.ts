import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/api-rate-limit";
import { fetchPriorCallContext } from "@/lib/prior-call-context";

export async function GET(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(request, {
      scope: `prior-calls:${auth.userId}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company")?.trim();
    if (!company) {
      return NextResponse.json({ error: "company is required" }, { status: 400 });
    }

    const context = await fetchPriorCallContext(auth.userId, company);
    return NextResponse.json({ context });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Prior calls failed");
    return NextResponse.json({ error: message }, { status });
  }
}
