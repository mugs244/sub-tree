import { NextResponse } from "next/server"

// Sets a cookie with the chosen plan then sends the browser to Clerk sign-up.
// Pricing card CTAs link here so the plan survives the sign-up redirect.
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const plan = searchParams.get("plan") ?? ""
  const allowed = ["pro", "business"]
  const safePlan = allowed.includes(plan) ? plan : "pro"

  const res = NextResponse.redirect(new URL("/sign-up", req.url))
  res.cookies.set("pending_plan", safePlan, {
    path: "/",
    maxAge: 60 * 30, // 30 min — enough to complete sign-up + onboarding
    httpOnly: true,
    sameSite: "lax",
  })
  return res
}
