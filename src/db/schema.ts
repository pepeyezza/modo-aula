import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ============================================================
   ENUMS
   ============================================================ */
export const roleEnum = pgEnum("role", ["admin", "teacher", "student", "institution"]);
export const courseModalityEnum = pgEnum("course_modality", [
  "virtual",
  "presencial",
  "mixta",
]);
export const courseStatusEnum = pgEnum("course_status", [
  "borrador",
  "publicado",
  "archivado",
]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "preinscripto",
  "inscripto",
  "en_curso",
  "finalizado",
  "aprobado",
  "desaprobado",
  "abandono",
]);
export const materialTypeEnum = pgEnum("material_type", [
  "texto",
  "pdf",
  "word",
  "powerpoint",
  "excel",
  "imagen",
  "video",
  "link",
  "audio",
  "archivo",
]);
export const questionTypeEnum = pgEnum("question_type", [
  "opcion_multiple",
  "verdadero_falso",
  "seleccion_multiple",
  "respuesta_corta",
  "respuesta_desarrollada",
  "relacionar",
]);
export const difficultyEnum = pgEnum("difficulty", ["facil", "medio", "dificil"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "presente",
  "ausente",
  "justificado",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pendiente",
  "entregado",
  "calificado",
  "requiere_correccion",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "inscripcion",
  "inicio_curso",
  "nuevo_material",
  "nueva_actividad",
  "fecha_entrega",
  "nueva_evaluacion",
  "actividad_calificada",
  "certificado_emitido",
  "mensaje",
  "respuesta_foro",
  "general",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "whatsapp",
]);
export const messageScopeEnum = pgEnum("message_scope", [
  "curso",
  "modulo",
  "alumno",
  "general",
]);
export const progressContentTypeEnum = pgEnum("progress_content_type", [
  "material",
  "video",
  "actividad",
  "evaluacion",
  "foro",
]);

/* ============================================================
   INSTITUCIONES (multi-tenant: cada institución administra sus
   propios cursos, profesores, alumnos y programas de forma
   aislada; el Administrador general de la plataforma ve/gestiona
   todas las instituciones)
   ============================================================ */
export const institutions = pgTable("institutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  logoUrl: text("logo_url"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 40 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   SITE SETTINGS (fila única: contenido editable del home público
   — hero, textos, imagen de fondo — configurado desde el Admin)
   ============================================================ */
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  heroBadge: varchar("hero_badge", { length: 200 }),
  heroTitle: varchar("hero_title", { length: 300 }),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: text("hero_image_url"),
  heroPrimaryCta: varchar("hero_primary_cta", { length: 100 }),
  heroSecondaryCta: varchar("hero_secondary_cta", { length: 100 }),
  featuredTitle: varchar("featured_title", { length: 200 }),
  featuredSubtitle: varchar("featured_subtitle", { length: 300 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ============================================================
   USERS & PERMISSIONS
   ============================================================ */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("student"),
  // Institución a la que pertenece este usuario (null = usuario de la
  // plataforma, gestionado directamente por el Administrador general).
  // Se usa tanto para la cuenta de login de la propia Institución como
  // para los profesores/alumnos que esa Institución administra.
  institutionId: uuid("institution_id").references(() => institutions.id, {
    onDelete: "set null",
  }),
  dni: varchar("dni", { length: 30 }),
  phone: varchar("phone", { length: 40 }),
  area: varchar("area", { length: 150 }),
  position: varchar("position", { length: 150 }),
  organization: varchar("organization", { length: 150 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  specialty: varchar("specialty", { length: 200 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: roleEnum("role").notNull(),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.role, t.permissionId] })]
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 150 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   CATEGORIES / PROGRAMS / COURSES
   ============================================================ */
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  description: text("description"),
});

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Institución dueña de este programa (null = programa de la plataforma,
  // creado directamente por el Administrador general).
  institutionId: uuid("institution_id").references(() => institutions.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  institution: varchar("institution", { length: 200 }),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  // Institución dueña de este curso (null = curso de la plataforma,
  // administrado directamente por el Administrador general).
  institutionId: uuid("institution_id").references(() => institutions.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  modality: courseModalityEnum("modality").notNull().default("virtual"),
  durationHours: integer("duration_hours").notNull().default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  capacity: integer("capacity"),
  status: courseStatusEnum("status").notNull().default("borrador"),
  institution: varchar("institution", { length: 200 }),
  minAttendancePercent: integer("min_attendance_percent").default(75),
  passingScorePercent: integer("passing_score_percent").default(60),
  programOrder: integer("program_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courseTeachers = pgTable(
  "course_teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.courseId, t.teacherId)]
);

export const courseRequirements = pgTable(
  "course_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    requiredCourseId: uuid("required_course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.courseId, t.requiredCourseId)]
);

/* ============================================================
   MODULES / LESSONS / MATERIALS
   ============================================================ */
export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  isMandatory: boolean("is_mandatory").notNull().default(true),
});

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  type: materialTypeEnum("type").notNull().default("archivo"),
  content: text("content"), // rich text body when type = texto
  fileUrl: text("file_url"), // uploaded file path
  externalUrl: text("external_url"), // link / youtube / vimeo
  durationSeconds: integer("duration_seconds"), // for video/audio
  order: integer("order").notNull().default(0),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videoViews = pgTable(
  "video_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    watchedSeconds: integer("watched_seconds").notNull().default(0),
    percentWatched: integer("percent_watched").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.materialId, t.userId)]
);

/* ============================================================
   ENROLLMENTS / PROGRESS
   ============================================================ */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("inscripto"),
    progressPercent: integer("progress_percent").notNull().default(0),
    finalScore: real("final_score"),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [unique().on(t.userId, t.courseId)]
);

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    contentType: progressContentTypeEnum("content_type").notNull(),
    contentId: uuid("content_id").notNull(),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
  },
  (t) => [unique().on(t.userId, t.contentType, t.contentId)]
);

/* ============================================================
   ACTIVITIES / SUBMISSIONS
   ============================================================ */
export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  dueDate: timestamp("due_date"),
  maxScore: integer("max_score").notNull().default(100),
  approvalCriteria: text("approval_criteria"),
  attachmentUrl: text("attachment_url"),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    textContent: text("text_content"),
    fileUrl: text("file_url"),
    status: submissionStatusEnum("status").notNull().default("pendiente"),
    grade: real("grade"),
    feedback: text("feedback"),
    submittedAt: timestamp("submitted_at"),
    gradedAt: timestamp("graded_at"),
    gradedBy: uuid("graded_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [unique().on(t.activityId, t.studentId)]
);

/* ============================================================
   FORUMS
   ============================================================ */
export const forums = pgTable("forums", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  prompt: text("prompt"),
  opensAt: timestamp("opens_at"),
  closesAt: timestamp("closes_at"),
  allowReplies: boolean("allow_replies").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  forumId: uuid("forum_id")
    .notNull()
    .references(() => forums.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   QUESTION BANK / QUIZZES
   ============================================================ */
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  moduleId: uuid("module_id").references(() => modules.id, {
    onDelete: "set null",
  }),
  topic: varchar("topic", { length: 150 }),
  difficulty: difficultyEnum("difficulty").notNull().default("medio"),
  type: questionTypeEnum("type").notNull(),
  text: text("text").notNull(),
  points: integer("points").notNull().default(1),
  explanation: text("explanation"),
  feedback: text("feedback"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Also used for "relacionar conceptos": text = left term, matchValue = right term
export const questionOptions = pgTable("question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  text: varchar("text", { length: 500 }).notNull(),
  matchValue: varchar("match_value", { length: 500 }),
  isCorrect: boolean("is_correct").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes"),
  attemptsAllowed: integer("attempts_allowed").notNull().default(1),
  passingScorePercent: integer("passing_score_percent").notNull().default(60),
  randomizeOrder: boolean("randomize_order").notNull().default(false),
  randomQuestionCount: integer("random_question_count"),
  isFinalExam: boolean("is_final_exam").notNull().default(false),
  dueDate: timestamp("due_date"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
  },
  (t) => [unique().on(t.quizId, t.questionId)]
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull().default(1),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeUsedSeconds: integer("time_used_seconds"),
  scorePercent: real("score_percent"),
  passed: boolean("passed"),
});

export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedOptionIds: jsonb("selected_option_ids"), // array of option ids chosen
  matchAnswers: jsonb("match_answers"), // {leftOptionId: rightValue} for "relacionar"
  textAnswer: text("text_answer"),
  isCorrect: boolean("is_correct"),
  pointsAwarded: real("points_awarded"),
  manuallyGraded: boolean("manually_graded").notNull().default(false),
  gradedFeedback: text("graded_feedback"),
});

/* ============================================================
   ATTENDANCE
   ============================================================ */
export const attendanceSessions = pgTable("attendance_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  topic: varchar("topic", { length: 200 }),
  // Enlace de videollamada de esta clase (Zoom/Meet/Teams pegado por el
  // profesor, o una sala generada dentro de la plataforma con Jitsi Meet).
  // Null = clase sin componente virtual, solo se usa para asistencia.
  meetingUrl: text("meeting_url"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull().default("presente"),
    note: text("note"),
  },
  (t) => [unique().on(t.sessionId, t.studentId)]
);

/* ============================================================
   CERTIFICATES
   ============================================================ */
export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").references(() => courses.id, {
    onDelete: "set null",
  }),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  code: varchar("code", { length: 40 }).notNull().unique(),
  hoursTotal: integer("hours_total").notNull().default(0),
  teacherName: varchar("teacher_name", { length: 200 }),
  institution: varchar("institution", { length: 200 }),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  pdfUrl: text("pdf_url"),
});

/* ============================================================
   NOTIFICATIONS / MESSAGES
   ============================================================ */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull().default("general"),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message"),
  link: text("link"),
  channel: notificationChannelEnum("channel").notNull().default("in_app"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  courseId: uuid("course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  moduleId: uuid("module_id").references(() => modules.id, {
    onDelete: "cascade",
  }),
  scope: messageScopeEnum("scope").notNull().default("alumno"),
  subject: varchar("subject", { length: 200 }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ============================================================
   GAMIFICATION (schema ready — UI is mock/"coming soon")
   ============================================================ */
export const pointsLedger = pgTable("points_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: varchar("reason", { length: 200 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  criteria: text("criteria"),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.badgeId)]
);

export const levels = pgTable("levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  minPoints: integer("min_points").notNull(),
});

/* ============================================================
   RELATIONS
   ============================================================ */
export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, { fields: [users.institutionId], references: [institutions.id] }),
  enrollments: many(enrollments),
  courseTeachers: many(courseTeachers),
  certificates: many(certificates),
  notifications: many(notifications),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  courses: many(courses),
  programs: many(programs),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.programId],
    references: [programs.id],
  }),
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  institutionRef: one(institutions, {
    fields: [courses.institutionId],
    references: [institutions.id],
  }),
  modules: many(modules),
  teachers: many(courseTeachers),
  enrollments: many(enrollments),
  certificates: many(certificates),
}));

export const courseTeachersRelations = relations(courseTeachers, ({ one }) => ({
  course: one(courses, { fields: [courseTeachers.courseId], references: [courses.id] }),
  teacher: one(users, { fields: [courseTeachers.teacherId], references: [users.id] }),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
  activities: many(activities),
  forums: many(forums),
  quizzes: many(quizzes),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  materials: many(materials),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  institutionRef: one(institutions, {
    fields: [programs.institutionId],
    references: [institutions.id],
  }),
  courses: many(courses),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const forumsRelations = relations(forums, ({ one, many }) => ({
  module: one(modules, { fields: [forums.moduleId], references: [modules.id] }),
  posts: many(forumPosts),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  module: one(modules, { fields: [quizzes.moduleId], references: [modules.id] }),
  quizQuestions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  course: one(courses, { fields: [questions.courseId], references: [courses.id] }),
  options: many(questionOptions),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  student: one(users, { fields: [quizAttempts.studentId], references: [users.id] }),
  answers: many(answers),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  module: one(modules, { fields: [activities.moduleId], references: [modules.id] }),
  submissions: many(submissions),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  lesson: one(lessons, { fields: [materials.lessonId], references: [lessons.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  activity: one(activities, { fields: [submissions.activityId], references: [activities.id] }),
  student: one(users, { fields: [submissions.studentId], references: [users.id] }),
}));

export const forumPostsRelations = relations(forumPosts, ({ one }) => ({
  forum: one(forums, { fields: [forumPosts.forumId], references: [forums.id] }),
  user: one(users, { fields: [forumPosts.userId], references: [users.id] }),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
  question: one(questions, { fields: [quizQuestions.questionId], references: [questions.id] }),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, { fields: [questionOptions.questionId], references: [questions.id] }),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  attempt: one(quizAttempts, { fields: [answers.attemptId], references: [quizAttempts.id] }),
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ one, many }) => ({
  course: one(courses, { fields: [attendanceSessions.courseId], references: [courses.id] }),
  records: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  session: one(attendanceSessions, { fields: [attendance.sessionId], references: [attendanceSessions.id] }),
  student: one(users, { fields: [attendance.studentId], references: [users.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
  program: one(programs, { fields: [certificates.programId], references: [programs.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  recipient: one(users, { fields: [messages.recipientId], references: [users.id] }),
  course: one(courses, { fields: [messages.courseId], references: [courses.id] }),
  module: one(modules, { fields: [messages.moduleId], references: [modules.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  course: one(courses, { fields: [userProgress.courseId], references: [courses.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));
