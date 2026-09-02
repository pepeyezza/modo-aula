import "server-only";
import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";

export async function getAdminDashboardData() {
  const [usersActive, coursesActive, enrollmentsAll, certificatesAll, activityLog] = await Promise.all([
    db.query.users.findMany({ where: eq(schema.users.active, true) }),
    db.query.courses.findMany({ where: eq(schema.courses.status, "publicado"), with: { enrollments: true, teachers: { with: { teacher: true } } } }),
    db.query.enrollments.findMany(),
    db.query.certificates.findMany(),
    db.query.activityLogs.findMany({ orderBy: [desc(schema.activityLogs.createdAt)], limit: 12, with: { user: true } }),
  ]);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = coursesActive.filter((c) => c.startDate && c.startDate > now && c.startDate <= in30Days);
  const inProgress = coursesActive.filter((c) => c.startDate && c.startDate <= now && (!c.endDate || c.endDate >= now));

  const allSubmissions = await db.query.submissions.findMany({ where: eq(schema.submissions.status, "entregado") });
  const pendingGrading = allSubmissions.length;

  const studentsByCourse = coursesActive
    .map((c) => ({ name: c.name, value: c.enrollments.length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const completionByCourse = coursesActive
    .map((c) => {
      const finished = c.enrollments.filter((e) => ["finalizado", "aprobado", "desaprobado"].includes(e.status));
      const pct = c.enrollments.length ? Math.round((finished.length / c.enrollments.length) * 100) : 0;
      return { name: c.name, value: pct };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const avgScoreByCourse = coursesActive
    .map((c) => {
      const scores = c.enrollments.map((e) => e.finalScore).filter((s): s is number => s != null);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return avg != null ? { name: c.name, value: avg } : null;
    })
    .filter((v): v is { name: string; value: number } => v != null)
    .slice(0, 8);

  const statusLabels: Record<string, string> = {
    preinscripto: "Preinscripto",
    inscripto: "Inscripto",
    en_curso: "En curso",
    finalizado: "Finalizado",
    aprobado: "Aprobado",
    desaprobado: "Desaprobado",
    abandono: "Abandonó",
  };
  const statusCounts = Object.keys(statusLabels).map((key) => ({
    name: statusLabels[key],
    value: enrollmentsAll.filter((e) => e.status === key).length,
  }));

  // Evolución mensual (últimos 6 meses) por fecha de inscripción
  const months: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("es-AR", { month: "short" });
    const value = enrollmentsAll.filter((e) => {
      const ed = new Date(e.enrolledAt);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
    }).length;
    months.push({ key, label, value });
  }

  return {
    stats: {
      usersActive: usersActive.length,
      coursesActive: coursesActive.length,
      inProgress: inProgress.length,
      studentsEnrolled: usersActive.filter((u) => u.role === "student").length,
      upcoming: upcoming.length,
      pendingGrading,
      certificatesIssued: certificatesAll.length,
    },
    studentsByCourse,
    completionByCourse,
    avgScoreByCourse,
    statusCounts,
    monthlyEvolution: months,
    recentActivity: activityLog,
  };
}

export async function getTeacherDashboardData(teacherId: string) {
  const links = await db.query.courseTeachers.findMany({
    where: eq(schema.courseTeachers.teacherId, teacherId),
    with: { course: { with: { enrollments: true, modules: { with: { activities: true, forums: true, quizzes: true, lessons: true } } } } },
  });
  const courses = links.map((l) => l.course);
  const courseIds = courses.map((c) => c.id);
  const moduleIds = courses.flatMap((c) => c.modules.map((m) => m.id));

  const activityIds = courses.flatMap((c) => c.modules.flatMap((m) => m.activities.map((a) => a.id)));
  const pendingSubmissions = activityIds.length
    ? await db.query.submissions.findMany({ where: eq(schema.submissions.status, "entregado") })
    : [];
  const relevantPending = pendingSubmissions.filter((s) => activityIds.includes(s.activityId));

  const totalStudents = new Set(courses.flatMap((c) => c.enrollments.map((e) => e.userId))).size;

  const upcomingLessons = courses.flatMap((c) =>
    c.modules.flatMap((m) => m.lessons.map((l) => ({ courseName: c.name, lessonTitle: l.title })))
  ).slice(0, 5);

  return {
    courses,
    stats: {
      coursesCount: courses.length,
      studentsCount: totalStudents,
      pendingGrading: relevantPending.length,
      forumsCount: courses.reduce((sum, c) => sum + c.modules.reduce((s, m) => s + m.forums.length, 0), 0),
    },
    upcomingLessons,
    moduleIds,
    courseIds,
  };
}

export async function getStudentDashboardData(studentId: string) {
  const enrollments = await db.query.enrollments.findMany({
    where: eq(schema.enrollments.userId, studentId),
    with: { course: { with: { teachers: { with: { teacher: true } } } } },
  });

  const certificates = await db.query.certificates.findMany({ where: eq(schema.certificates.userId, studentId) });

  return { enrollments, certificates };
}
