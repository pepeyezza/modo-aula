import type { getCourseFull } from "@/data/courses";

export type CourseFull = NonNullable<Awaited<ReturnType<typeof getCourseFull>>>;
export type ModuleFull = CourseFull["modules"][number];
export type LessonFull = ModuleFull["lessons"][number];
export type MaterialFull = LessonFull["materials"][number];
export type ActivityFull = ModuleFull["activities"][number];
export type ForumFull = ModuleFull["forums"][number];
export type QuizFull = ModuleFull["quizzes"][number];
export type EnrollmentFull = CourseFull["enrollments"][number];
