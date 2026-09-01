import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

const authRoutes = ["/login"];

const protectedRoutes = ["/"];

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuth = !!session;
  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.includes(pathname);

  if (isAuth && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuth && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
