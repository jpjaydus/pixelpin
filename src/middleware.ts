import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow access to public routes
  const publicPaths = [
    "/",
    "/signin",
    "/signup",
    "/api/auth",
    "/_next",
    "/favicon.ico",
  ];

  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // For now, allow all other routes (we'll add proper auth check later)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Temporarily disable middleware to debug 404 issue
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    // "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};