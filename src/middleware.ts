import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { requireSecret } from "@/lib/env";

// jsonwebtoken relies on Node's crypto module, which isn't available in the
// default Edge middleware runtime -- run this middleware on the Node runtime
// so JWT verification actually works instead of silently failing every check.
export const runtime = "nodejs";

const JWT_SECRET = requireSecret("SESSION_SECRET", "pawffee-dev-secret-change-me");
const SESSION_COOKIE = "pawffee_admin_session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if ((isAdminPage || isAdminApi) && !isAuthed(req)) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && isAuthed(req)) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
