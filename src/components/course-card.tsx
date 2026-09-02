import Link from "next/link";
import { Calendar, Users, Layers, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const MODALITY_LABEL: Record<string, string> = {
  virtual: "Virtual",
  presencial: "Presencial",
  mixta: "Mixta",
};

type CourseCardData = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  modality: string;
  durationHours: number;
  startDate?: Date | string | null;
  capacity?: number | null;
  modules?: { id: string }[];
  enrollments?: { id: string }[];
  teachers?: { teacher: { firstName: string; lastName: string } }[];
  category?: { name: string } | null;
  institutionRef?: { name: string; logoUrl: string | null } | null;
};

export function CourseCard({ course, href }: { course: CourseCardData; href?: string }) {
  const teacherNames = course.teachers
    ?.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`)
    .join(", ");
  const seatsLeft =
    course.capacity != null ? Math.max(course.capacity - (course.enrollments?.length ?? 0), 0) : null;

  return (
    <Link
      href={href ?? `/catalogo/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--foreground)]">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.imageUrl} alt={course.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/90">
            <Layers className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {course.category && <Badge variant="outline" className="bg-white/90">{course.category.name}</Badge>}
          <Badge variant="secondary" className="bg-white/90">{MODALITY_LABEL[course.modality] ?? course.modality}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-[var(--foreground)] group-hover:text-[var(--primary)]">
          {course.name}
        </h3>
        {course.institutionRef && (
          <div className="flex items-center gap-1.5">
            {course.institutionRef.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.institutionRef.logoUrl}
                alt={course.institutionRef.name}
                className="h-5 w-5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[8px] font-semibold text-[var(--primary)]">
                {course.institutionRef.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate text-xs font-medium text-[var(--muted-foreground)]">
              {course.institutionRef.name}
            </span>
          </div>
        )}
        {course.description && (
          <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{course.description}</p>
        )}
        {teacherNames && <p className="text-xs text-[var(--muted-foreground)]">Dictado por {teacherNames}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {formatDate(course.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {course.durationHours}h
          </span>
          {seatsLeft !== null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {seatsLeft} cupos
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
