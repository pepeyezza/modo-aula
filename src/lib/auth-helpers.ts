import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type Role = "admin" | "teacher" | "student" | "institution";

export async function getSession() {
  return auth();
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(roleHome(user.role));
  }
  return user;
}

export function roleHome(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/profesor";
  if (role === "institution") return "/institucion";
  return "/alumno";
}
