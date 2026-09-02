import { notFound, redirect } from "next/navigation";
import { getCourseFull } from "@/data/courses";
import { requireRole } from "@/lib/auth-helpers";
import { CourseManager } from "@/components/course-manager/course-manager";

export default async function InstitutionCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("institution");
  const course = await getCourseFull(id);
  if (!course) notFound();

  if (course.institutionId !== user.institutionId) {
    redirect("/institucion/cursos");
  }

  return <CourseManager course={course} basePath="/institucion" isAdmin publicSlugPrefix="/catalogo" />;
}
