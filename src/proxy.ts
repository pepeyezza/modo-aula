import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  teacher: "/profesor",
  student: "/alumno",
  institution: "/institucion",
};

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const path = nextUrl.pathname;

  const isAdminRoute = path.startsWith("/admin");
  const isTeacherRoute = path.startsWith("/profesor");
  const isStudentRoute = path.startsWith("/alumno");
  const isInstitutionRoute = path.startsWith("/institucion");
  const isProtected = isAdminRoute || isTeacherRoute || isStudentRoute || isInstitutionRoute;

  if (!isProtected) return NextResponse.next();

  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/", nextUrl));
  }
  if (isTeacherRoute && role !== "teacher" && role !== "admin" && role !== "institution") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/", nextUrl));
  }
  if (isStudentRoute && role !== "student" && role !== "admin") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/", nextUrl));
  }
  if (isInstitutionRoute && role !== "institution") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/profesor/:path*", "/alumno/:path*", "/institucion/:path*"],
};
