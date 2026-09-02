"use server";

import { db, schema } from "@/db";
import { ilike, or, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";

export async function globalSearch(query: string) {
  const user = await requireUser();
  const q = `%${query.trim()}%`;
  if (!query.trim()) return { courses: [], users: [], materials: [], certificates: [] };

  const courses = await db.query.courses.findMany({
    where: or(ilike(schema.courses.name, q), ilike(schema.courses.description, q)),
    limit: 8,
  });

  const users =
    user.role === "admin"
      ? await db.query.users.findMany({
          where: or(ilike(schema.users.firstName, q), ilike(schema.users.lastName, q), ilike(schema.users.email, q)),
          limit: 8,
        })
      : [];

  const materials = await db.query.materials.findMany({
    where: ilike(schema.materials.title, q),
    limit: 8,
    with: { lesson: { with: { module: { with: { course: true } } } } },
  });

  const certificates =
    user.role === "admin"
      ? await db.query.certificates.findMany({ where: ilike(schema.certificates.code, q), limit: 5, with: { user: true, course: true } })
      : [];

  return { courses, users, materials, certificates };
}
