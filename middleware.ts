import { NextResponse, type NextRequest } from "next/server";

// Route gating via the tn_role cookie set at login.
// This is UX-level routing only — real authorization happens in the
// backend Edge Functions on every API call.
export function middleware(request: NextRequest) {
  const role = request.cookies.get("tn_role")?.value;
  const path = request.nextUrl.pathname;

  const isAuthPage = path.startsWith("/auth");
  const isInternalRoute = path.startsWith("/internal");

  if (!role && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (role && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = isInternalRole(role) ? "/internal/dashboard" : "/external/portal";
    return NextResponse.redirect(url);
  }

  if (role && isInternalRoute && !isInternalRole(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/external/portal";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function isInternalRole(role?: string) {
  return role === "admin" || role === "manager" || role === "agent";
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
