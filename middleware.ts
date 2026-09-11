import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isValidAuthToken } from "./lib/auth";

// Gates every request behind the shared password (see lib/auth.ts) — the
// login page and its own API route are excluded below so the gate doesn't
// lock itself out, and this deliberately covers /api/generate-pdf too:
// a lock screen in front of the React page alone would do nothing to stop
// someone from hitting the PDF-generation endpoint directly.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (await isValidAuthToken(token)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico|letterhead).*)"],
};
