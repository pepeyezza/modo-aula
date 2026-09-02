import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { getStudentCourseView } from "@/data/student-course";
import { StudentCourseViewer } from "@/components/student-course/viewer";

export default async function StudentCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("student", "admin");
  const data = await getStudentCourseView(id, user.id);
  if (!data) notFound();

  return <StudentCourseViewer data={data} />;
}
