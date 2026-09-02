import { notFound } from "next/navigation";
import { getCourseFull } from "@/data/courses";
import { CourseManager } from "@/components/course-manager/course-manager";

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseFull(id);
  if (!course) notFound();

  return <CourseManager course={course} basePath="/admin" isAdmin publicSlugPrefix="/catalogo" />;
}
