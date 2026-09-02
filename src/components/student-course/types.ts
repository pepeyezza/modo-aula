import type { getStudentCourseView } from "@/data/student-course";

export type StudentCourseData = NonNullable<Awaited<ReturnType<typeof getStudentCourseView>>>;
export type StudentModule = StudentCourseData["course"]["modules"][number];
export type StudentLesson = StudentModule["lessons"][number];
export type StudentMaterial = StudentLesson["materials"][number];
export type StudentActivity = StudentModule["activities"][number];
export type StudentForum = StudentModule["forums"][number];
export type StudentQuiz = StudentModule["quizzes"][number];
