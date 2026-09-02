import { notFound, redirect } from "next/navigation";
import { getCourseFull } from "@/data/courses";
import { requireRole } from "@/lib/auth-helpers";
import { CourseManager } from "@/components/course-manager/course-manager";

export default async function TeacherCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("teacher", "admin");
  const course = await getCourseFull(id);
  if (!course) notFound();

  if (user.role === "teacher" && !course.teachers.some((t) => t.teacher.id === user.id)) {
    redirect("/profesor/cursos");
  }

  return <CourseManager course={course} basePath="/profesor" isAdmin={false} publicSlugPrefix="/catalogo" />;
}
