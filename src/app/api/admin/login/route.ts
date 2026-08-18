import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { allowed, retryAfterMs } = checkLoginRateLimit(ip);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in about ${minutes} minute(s).` },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const valid = await verifyCredentials(email, password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  resetLoginRateLimit(ip);
  const token = createSessionToken(email.toLowerCase());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
