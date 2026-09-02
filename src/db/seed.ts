/**
 * Seed de datos de demostración para Capacita.
 *
 * Crea 3 categorías, 3 programas, 6 cursos con contenido real (módulos,
 * clases, materiales, actividades, foros, banco de preguntas, evaluaciones),
 * 1 administrador, 10 profesores y 50 alumnos — incluyendo las 3 cuentas
 * demo referenciadas en la pantalla de login:
 *
 *   admin@capacita.demo     / Demo1234!
 *   profesor@capacita.demo  / Demo1234!
 *   alumno@capacita.demo    / Demo1234!
 *
 * (el resto de los usuarios generados también usa la contraseña Demo1234!
 * para simplificar las pruebas).
 *
 * Se simulan inscripciones, progreso, entregas, intentos de evaluación,
 * asistencia, foros y certificados usando la MISMA lógica de cálculo de
 * progreso que la app real (ver src/lib/progress.ts), para que los datos
 * queden perfectamente consistentes con lo que un uso real produciría.
 *
 * Ejecutar con: npm run seed
 */
import "dotenv/config";
import { db, schema } from "./index";
import { sql, eq, and, inArray } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { randomCode, slugify } from "../lib/utils";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function pickWeighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of items) {
    if (r < w) return item;
    r -= w;
  }
  return items[items.length - 1][0];
}
function daysFrom(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const VIDEO_URL = "https://www.youtube.com/watch?v=8S0FDjFBj8o";
const LINK_URL = "https://www.argentina.gob.ar/";
const INSTITUTION = process.env.APP_INSTITUTION_NAME || "Instituto de Capacitación Continua";

async function main() {
  console.log("🌱 Limpiando base de datos...");
  await db.execute(sql`
    TRUNCATE TABLE
      points_ledger, user_badges, badges, levels,
      messages, notifications,
      certificates,
      attendance, attendance_sessions,
      answers, quiz_attempts, quiz_questions, quizzes,
      question_options, questions,
      forum_posts, forums,
      submissions, activities,
      video_views, user_progress,
      materials, lessons, modules,
      enrollments,
      course_requirements, course_teachers, courses,
      programs, categories,
      activity_logs, password_reset_tokens, role_permissions, permissions,
      users, institutions
    RESTART IDENTITY CASCADE
  `);

  const passwordHash = await hashPassword("Demo1234!");

  /* ------------------------------------------------------------------ */
  /* USUARIOS                                                           */
  /* ------------------------------------------------------------------ */
  console.log("👤 Creando usuarios...");

  const [admin] = await db
    .insert(schema.users)
    .values({
      firstName: "Admin",
      lastName: "Demo",
      email: "admin@capacita.demo",
      passwordHash,
      role: "admin",
      position: "Coordinador general de capacitación",
      organization: INSTITUTION,
      active: true,
    })
    .returning();

  const TEACHER_NAMES: [string, string, string][] = [
    ["Profesor", "Demo", "Gestión pública y transformación digital"],
    ["Diego", "Fernández", "Compras y contrataciones públicas"],
    ["Lucía", "Gómez", "Ciberseguridad"],
    ["Martín", "Álvarez", "Ofimática y herramientas digitales"],
    ["Carla", "Rodríguez", "Liderazgo y desarrollo de equipos"],
    ["Pablo", "Giménez", "Comunicación institucional"],
    ["Valeria", "Núñez", "Gestión documental"],
    ["Sebastián", "Torres", "Administración pública"],
    ["Romina", "Acosta", "Tecnología educativa"],
    ["Gabriel", "Ríos", "Recursos humanos"],
  ];
  const teachers = await db
    .insert(schema.users)
    .values(
      TEACHER_NAMES.map(([firstName, lastName, specialty], i) => ({
        firstName,
        lastName,
        email: i === 0 ? "profesor@capacita.demo" : `${slugify(firstName)}.${slugify(lastName)}@capacita.demo`,
        passwordHash,
        role: "teacher" as const,
        specialty,
        bio: `Capacitador/a especializado/a en ${specialty.toLowerCase()}, con amplia experiencia en formación de equipos de organismos públicos.`,
        organization: INSTITUTION,
        active: true,
      }))
    )
    .returning();

  const STUDENT_FIRST = [
    "Alumno", "Sofía", "Mateo", "Camila", "Lucas", "Valentina", "Joaquín", "Martina", "Benjamín", "Emma",
    "Tomás", "Julieta", "Santiago", "Agustina", "Bautista", "Isabella", "Juan", "Catalina", "Nicolás", "Renata",
    "Facundo", "Delfina", "Emiliano", "Victoria", "Ignacio", "Pilar", "Franco", "Josefina", "Thiago", "Antonella",
    "Máximo", "Guadalupe", "Ramiro", "Milagros", "Federico", "Zoe", "Gonzalo", "Abril", "Bruno", "Luciana",
    "Agustín", "Alma", "Dylan", "Ariana", "Ezequiel", "Mora", "Leandro", "Malena", "Rodrigo", "Clara",
  ];
  const STUDENT_LAST = [
    "Demo", "Pérez", "González", "Rodríguez", "López", "Martínez", "García", "Fernández", "Díaz", "Sánchez",
    "Romero", "Álvarez", "Torres", "Ruiz", "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez",
    "Molina", "Ortiz", "Silva", "Núñez", "Rojas", "Aguirre", "Ibáñez", "Vega", "Cabrera", "Peralta",
    "Luna", "Correa", "Vega", "Godoy", "Paz", "Campos", "Sosa", "Vera", "Domínguez", "Castro",
    "Reyes", "Ríos", "Morales", "Ledesma", "Bustos", "Coronel", "Villalba", "Maidana", "Quiroga", "Escobar",
  ];
  const students = await db
    .insert(schema.users)
    .values(
      STUDENT_FIRST.map((firstName, i) => ({
        firstName,
        lastName: STUDENT_LAST[i],
        email: i === 0 ? "alumno@capacita.demo" : `${slugify(firstName)}.${slugify(STUDENT_LAST[i])}${i}@capacita.demo`,
        passwordHash,
        role: "student" as const,
        dni: `${randInt(20000000, 45000000)}`,
        area: pick(["Recursos Humanos", "Administración", "Sistemas", "Atención al Público", "Legal y Técnica", "Obras Públicas", "Hacienda"]),
        position: pick(["Agente administrativo", "Analista", "Coordinador/a de área", "Técnico/a", "Asistente"]),
        organization: pick([INSTITUTION, "Municipalidad", "Organismo Provincial", "Ente Descentralizado"]),
        active: true,
      }))
    )
    .returning();

  const demoStudent = students[0];
  const demoTeacher = teachers[0];

  /* ------------------------------------------------------------------ */
  /* CATEGORÍAS / PROGRAMAS / CURSOS                                    */
  /* ------------------------------------------------------------------ */
  console.log("📚 Creando categorías, programas y cursos...");

  const CATEGORY_DEFS = [
    { name: "Administración Pública", description: "Gestión, trámites y procesos del sector público." },
    { name: "Tecnología y Sistemas", description: "Herramientas digitales, ciberseguridad y ofimática." },
    { name: "Gestión y Liderazgo", description: "Desarrollo de equipos y comunicación institucional." },
  ];
  const categories = await db
    .insert(schema.categories)
    .values(CATEGORY_DEFS.map((c) => ({ name: c.name, slug: slugify(c.name), description: c.description })))
    .returning();

  const PROGRAM_DEFS = [
    { name: "Programa de Modernización Municipal", categoryIndex: 0, institution: "Municipalidad" },
    { name: "Programa de Transformación Digital", categoryIndex: 1, institution: INSTITUTION },
    { name: "Programa de Desarrollo de Líderes", categoryIndex: 2, institution: INSTITUTION },
  ];
  const programs = await db
    .insert(schema.programs)
    .values(
      PROGRAM_DEFS.map((p) => ({
        name: p.name,
        slug: slugify(p.name),
        description: `Trayecto formativo compuesto por cursos orientados a ${CATEGORY_DEFS[p.categoryIndex].name.toLowerCase()}.`,
        institution: p.institution,
        published: true,
      }))
    )
    .returning();

  const today = new Date();

  type CourseDef = {
    name: string;
    description: string;
    categoryIndex: number;
    programIndex: number;
    modality: (typeof schema.courseModalityEnum.enumValues)[number];
    durationHours: number;
    capacity: number;
    startDate: Date;
    endDate: Date;
    minAttendancePercent: number;
    passingScorePercent: number;
    hasAttendance: boolean;
    phase: "finished" | "active" | "upcoming";
  };

  const COURSE_DEFS: CourseDef[] = [
    {
      name: "Gestión Documental y Trámites Digitales",
      description: "Digitalización de expedientes, firma electrónica y gestión documental sin papel.",
      categoryIndex: 0, programIndex: 0, modality: "mixta", durationHours: 40, capacity: 40,
      startDate: daysFrom(today, -150), endDate: daysFrom(today, -55),
      minAttendancePercent: 75, passingScorePercent: 60, hasAttendance: true, phase: "finished",
    },
    {
      name: "Compras Públicas y Contrataciones",
      description: "Procedimientos de compras, licitaciones y contrataciones del Estado.",
      categoryIndex: 0, programIndex: 0, modality: "virtual", durationHours: 30, capacity: 35,
      startDate: daysFrom(today, -110), endDate: daysFrom(today, -10),
      minAttendancePercent: 75, passingScorePercent: 60, hasAttendance: false, phase: "finished",
    },
    {
      name: "Introducción a la Ciberseguridad",
      description: "Buenas prácticas de seguridad de la información para agentes públicos.",
      categoryIndex: 1, programIndex: 1, modality: "virtual", durationHours: 25, capacity: 50,
      startDate: daysFrom(today, -40), endDate: daysFrom(today, 50),
      minAttendancePercent: 75, passingScorePercent: 60, hasAttendance: false, phase: "active",
    },
    {
      name: "Herramientas de Ofimática Avanzada",
      description: "Planillas de cálculo, procesadores de texto y presentaciones aplicadas al trabajo diario.",
      categoryIndex: 1, programIndex: 1, modality: "virtual", durationHours: 20, capacity: 45,
      startDate: daysFrom(today, -20), endDate: daysFrom(today, 40),
      minAttendancePercent: 75, passingScorePercent: 60, hasAttendance: false, phase: "active",
    },
    {
      name: "Liderazgo y Trabajo en Equipo",
      description: "Herramientas de liderazgo situacional y gestión de equipos de trabajo.",
      categoryIndex: 2, programIndex: 2, modality: "presencial", durationHours: 20, capacity: 30,
      startDate: daysFrom(today, 20), endDate: daysFrom(today, 80),
      minAttendancePercent: 80, passingScorePercent: 60, hasAttendance: true, phase: "upcoming",
    },
    {
      name: "Comunicación Institucional Efectiva",
      description: "Comunicación interna, redacción institucional y atención al ciudadano.",
      categoryIndex: 2, programIndex: 2, modality: "mixta", durationHours: 15, capacity: 30,
      startDate: daysFrom(today, -15), endDate: daysFrom(today, 45),
      minAttendancePercent: 75, passingScorePercent: 60, hasAttendance: true, phase: "active",
    },
  ];

  const courses = await db
    .insert(schema.courses)
    .values(
      COURSE_DEFS.map((c) => ({
        programId: programs[c.programIndex].id,
        categoryId: categories[c.categoryIndex].id,
        name: c.name,
        slug: slugify(c.name),
        description: c.description,
        modality: c.modality,
        durationHours: c.durationHours,
        startDate: c.startDate,
        endDate: c.endDate,
        capacity: c.capacity,
        status: "publicado" as const,
        institution: INSTITUTION,
        minAttendancePercent: c.minAttendancePercent,
        passingScorePercent: c.passingScorePercent,
      }))
    )
    .returning();

  // Asignación de profesores
  const COURSE_TEACHERS: number[][] = [
    [0, 5], // curso 0: Profesor Demo + Romina Acosta (co-dictado)
    [1],
    [0, 6], // curso 2: Profesor Demo + Valeria Núñez
    [3],
    [4],
    [5],
  ];
  await db.insert(schema.courseTeachers).values(
    COURSE_TEACHERS.flatMap((teacherIdxs, courseIdx) =>
      teacherIdxs.map((ti) => ({ courseId: courses[courseIdx].id, teacherId: teachers[ti].id }))
    )
  );

  /* ------------------------------------------------------------------ */
  /* CONTENIDO POR CURSO                                                */
  /* ------------------------------------------------------------------ */
  console.log("🧩 Creando módulos, clases, materiales, actividades, foros y banco de preguntas...");

  type CourseContent = {
    moduleIds: string[];
    mandatoryMaterialIds: string[];
    mandatoryActivityIds: string[];
    forumId: string;
    regularQuizId: string;
    finalQuizId: string;
    finalQuizPassingPercent: number;
    attendanceSessionIds: string[];
  };
  const contentByCourse: CourseContent[] = [];

  for (let ci = 0; ci < courses.length; ci++) {
    const course = courses[ci];
    const def = COURSE_DEFS[ci];
    const teacherId = teachers[COURSE_TEACHERS[ci][0]].id;

    const modules = await db
      .insert(schema.modules)
      .values([
        { courseId: course.id, title: "Módulo 1: Introducción y fundamentos", description: `Conceptos base de ${course.name.toLowerCase()}.`, order: 0, published: true },
        { courseId: course.id, title: "Módulo 2: Desarrollo del contenido", description: "Contenido práctico y aplicado.", order: 1, published: true },
        { courseId: course.id, title: "Módulo 3: Evaluación final", description: "Cierre del curso y evaluación integradora.", order: 2, published: true },
      ])
      .returning();
    const [m1, m2, m3] = modules;

    const lessons = await db
      .insert(schema.lessons)
      .values([
        { moduleId: m1.id, title: "Bienvenida y objetivos", order: 0, published: true, isMandatory: true },
        { moduleId: m1.id, title: "Marco conceptual", order: 1, published: true, isMandatory: true },
        { moduleId: m2.id, title: "Desarrollo práctico I", order: 0, published: true, isMandatory: true },
        { moduleId: m2.id, title: "Desarrollo práctico II", order: 1, published: true, isMandatory: true },
        { moduleId: m3.id, title: "Cierre e integración", order: 0, published: true, isMandatory: true },
      ])
      .returning();

    const materialRows: (typeof schema.materials.$inferInsert)[] = [];
    lessons.forEach((lesson, li) => {
      materialRows.push({
        lessonId: lesson.id,
        title: `${lesson.title} — material de lectura`,
        type: "texto",
        content: `Contenido de la clase "${lesson.title}" del curso ${course.name}. En esta sección se desarrollan los conceptos clave necesarios para avanzar en el curso, con ejemplos aplicados a la gestión pública.`,
        order: 0,
        isMandatory: true,
        published: true,
      });
      materialRows.push({
        lessonId: lesson.id,
        title: `${lesson.title} — video explicativo`,
        type: "video",
        externalUrl: VIDEO_URL,
        durationSeconds: 480,
        order: 1,
        isMandatory: true,
        published: true,
      });
      if (li === 2) {
        materialRows.push({
          lessonId: lesson.id,
          title: "Material complementario (opcional)",
          type: "link",
          externalUrl: LINK_URL,
          order: 2,
          isMandatory: false,
          published: true,
        });
      }
    });
    const materials = await db.insert(schema.materials).values(materialRows).returning();
    const mandatoryMaterialIds = materials.filter((m) => m.isMandatory).map((m) => m.id);

    const activities = await db
      .insert(schema.activities)
      .values([
        {
          moduleId: m1.id,
          title: "Actividad 1: Diagnóstico inicial",
          description: "Reflexión inicial sobre la situación actual en tu área de trabajo.",
          instructions: "Redactá un breve informe (máximo 1 página) describiendo cómo se aborda hoy esta temática en tu organización.",
          dueDate: daysFrom(def.startDate, 14),
          maxScore: 100,
          isMandatory: true,
          published: true,
        },
        {
          moduleId: m2.id,
          title: "Actividad 2: Caso práctico",
          description: "Resolución de un caso práctico aplicando lo aprendido en el módulo.",
          instructions: "Desarrollá la resolución del caso propuesto en el material de la clase, justificando cada paso.",
          dueDate: daysFrom(def.startDate, 35),
          maxScore: 100,
          isMandatory: true,
          published: true,
        },
        {
          moduleId: m3.id,
          title: "Actividad 3: Trabajo integrador",
          description: "Trabajo final integrador del curso.",
          instructions: "Presentá una propuesta de mejora para tu área aplicando al menos tres conceptos vistos durante el curso.",
          dueDate: daysFrom(def.endDate, -3),
          maxScore: 100,
          isMandatory: true,
          published: true,
        },
      ])
      .returning();

    const [forum] = await db
      .insert(schema.forums)
      .values([
        {
          moduleId: m2.id,
          title: "Foro de consulta y debate",
          prompt: `Compartí tus dudas y experiencias sobre "${course.name}" con tus compañeros y el equipo docente.`,
          allowReplies: true,
          createdBy: teacherId,
        },
      ])
      .returning();

    // --- Banco de preguntas (8 por curso) ---
    const questionDefs: { type: (typeof schema.questionTypeEnum.enumValues)[number]; text: string; points: number; moduleId: string }[] = [
      { type: "opcion_multiple", text: `¿Cuál de las siguientes opciones describe mejor un objetivo central de "${course.name}"?`, points: 2, moduleId: m1.id },
      { type: "opcion_multiple", text: "¿Cuál de las siguientes prácticas se recomienda aplicar en el trabajo diario?", points: 2, moduleId: m2.id },
      { type: "verdadero_falso", text: "La planificación previa mejora los resultados del proceso.", points: 1, moduleId: m1.id },
      { type: "seleccion_multiple", text: "Marcá todas las opciones que correspondan a buenas prácticas vistas en el curso.", points: 3, moduleId: m2.id },
      { type: "respuesta_corta", text: "Mencioná un concepto clave desarrollado en el Módulo 1.", points: 2, moduleId: m1.id },
      { type: "respuesta_desarrollada", text: "Explicá con tus palabras cómo aplicarías lo aprendido en tu puesto de trabajo.", points: 4, moduleId: m3.id },
      { type: "relacionar", text: "Relacioná cada concepto con su definición correspondiente.", points: 3, moduleId: m2.id },
      { type: "opcion_multiple", text: "¿Qué opción representa correctamente el cierre del proceso trabajado en el curso?", points: 2, moduleId: m3.id },
    ];

    const questions = await db
      .insert(schema.questions)
      .values(
        questionDefs.map((q) => ({
          courseId: course.id,
          moduleId: q.moduleId,
          topic: course.name,
          difficulty: pick(["facil", "medio", "dificil"] as const),
          type: q.type,
          text: q.text,
          points: q.points,
          explanation: "Ver material de la clase correspondiente para más detalle.",
          createdBy: teacherId,
        }))
      )
      .returning();

    const optionRows: (typeof schema.questionOptions.$inferInsert)[] = [];
    questions.forEach((q) => {
      if (q.type === "opcion_multiple") {
        optionRows.push(
          { questionId: q.id, text: "Opción A — correcta", isCorrect: true, order: 0 },
          { questionId: q.id, text: "Opción B", isCorrect: false, order: 1 },
          { questionId: q.id, text: "Opción C", isCorrect: false, order: 2 },
          { questionId: q.id, text: "Opción D", isCorrect: false, order: 3 }
        );
      } else if (q.type === "verdadero_falso") {
        optionRows.push(
          { questionId: q.id, text: "Verdadero", isCorrect: true, order: 0 },
          { questionId: q.id, text: "Falso", isCorrect: false, order: 1 }
        );
      } else if (q.type === "seleccion_multiple") {
        optionRows.push(
          { questionId: q.id, text: "Opción A — correcta", isCorrect: true, order: 0 },
          { questionId: q.id, text: "Opción B — correcta", isCorrect: true, order: 1 },
          { questionId: q.id, text: "Opción C", isCorrect: false, order: 2 },
          { questionId: q.id, text: "Opción D", isCorrect: false, order: 3 }
        );
      } else if (q.type === "relacionar") {
        optionRows.push(
          { questionId: q.id, text: "Concepto 1", matchValue: "Definición 1", isCorrect: false, order: 0 },
          { questionId: q.id, text: "Concepto 2", matchValue: "Definición 2", isCorrect: false, order: 1 },
          { questionId: q.id, text: "Concepto 3", matchValue: "Definición 3", isCorrect: false, order: 2 }
        );
      }
      // respuesta_corta / respuesta_desarrollada: sin opciones (se corrigen por texto)
    });
    if (optionRows.length) await db.insert(schema.questionOptions).values(optionRows);

    const [regularQuiz, finalQuiz] = await db
      .insert(schema.quizzes)
      .values([
        {
          moduleId: m2.id,
          title: "Evaluación de seguimiento",
          description: "Evaluación intermedia sobre los contenidos del Módulo 2.",
          timeLimitMinutes: 20,
          attemptsAllowed: 2,
          passingScorePercent: 60,
          isFinalExam: false,
          dueDate: daysFrom(def.startDate, 40),
          published: true,
        },
        {
          moduleId: m3.id,
          title: "Examen final",
          description: "Evaluación integradora final del curso.",
          timeLimitMinutes: 30,
          attemptsAllowed: 2,
          passingScorePercent: def.passingScorePercent,
          isFinalExam: true,
          dueDate: def.endDate,
          published: true,
        },
      ])
      .returning();

    await db.insert(schema.quizQuestions).values([
      ...questions.slice(0, 4).map((q, i) => ({ quizId: regularQuiz.id, questionId: q.id, order: i })),
      ...questions.slice(4).map((q, i) => ({ quizId: finalQuiz.id, questionId: q.id, order: i })),
    ]);

    let attendanceSessionIds: string[] = [];
    if (def.hasAttendance) {
      const sessions = await db
        .insert(schema.attendanceSessions)
        .values(
          Array.from({ length: 5 }, (_, i) => ({
            courseId: course.id,
            date: daysFrom(def.startDate, i * 14 + 3),
            topic: `Encuentro ${i + 1}`,
            createdBy: teacherId,
          }))
        )
        .returning();
      attendanceSessionIds = sessions.map((s) => s.id);
    }

    contentByCourse.push({
      moduleIds: modules.map((m) => m.id),
      mandatoryMaterialIds,
      mandatoryActivityIds: activities.map((a) => a.id),
      forumId: forum.id,
      regularQuizId: regularQuiz.id,
      finalQuizId: finalQuiz.id,
      finalQuizPassingPercent: def.passingScorePercent,
      attendanceSessionIds,
    });
  }

  /* ------------------------------------------------------------------ */
  /* PROGRESO — misma lógica que src/lib/progress.ts                    */
  /* ------------------------------------------------------------------ */
  async function recomputeCourseProgress(userId: string, courseId: string) {
    const content = contentByCourse[courses.findIndex((c) => c.id === courseId)];

    let materialsPct = content.mandatoryMaterialIds.length === 0 ? 100 : 0;
    if (content.mandatoryMaterialIds.length > 0) {
      const done = await db.query.userProgress.findMany({
        where: and(eq(schema.userProgress.userId, userId), eq(schema.userProgress.completed, true), inArray(schema.userProgress.contentId, content.mandatoryMaterialIds)),
      });
      materialsPct = Math.round((done.length / content.mandatoryMaterialIds.length) * 100);
    }

    let activitiesPct = content.mandatoryActivityIds.length === 0 ? 100 : 0;
    if (content.mandatoryActivityIds.length > 0) {
      const subs = await db.query.submissions.findMany({
        where: and(eq(schema.submissions.studentId, userId), inArray(schema.submissions.activityId, content.mandatoryActivityIds)),
      });
      const done = subs.filter((s) => s.status === "entregado" || s.status === "calificado").length;
      activitiesPct = Math.round((done / content.mandatoryActivityIds.length) * 100);
    }

    const quizIds = [content.regularQuizId, content.finalQuizId];
    const attempts = await db.query.quizAttempts.findMany({
      where: and(eq(schema.quizAttempts.studentId, userId), inArray(schema.quizAttempts.quizId, quizIds)),
    });
    const doneQuizIds = new Set(attempts.filter((a) => a.submittedAt).map((a) => a.quizId));
    const quizzesPct = Math.round((doneQuizIds.size / quizIds.length) * 100);

    const posts = await db.query.forumPosts.findMany({
      where: and(eq(schema.forumPosts.userId, userId), eq(schema.forumPosts.forumId, content.forumId)),
    });
    const forumsPct = posts.length > 0 ? 100 : 0;

    let attendancePct = 100;
    if (content.attendanceSessionIds.length > 0) {
      const records = await db.query.attendance.findMany({
        where: and(eq(schema.attendance.studentId, userId), inArray(schema.attendance.sessionId, content.attendanceSessionIds)),
      });
      const present = records.filter((r) => r.status === "presente" || r.status === "justificado").length;
      attendancePct = Math.round((present / content.attendanceSessionIds.length) * 100);
    }

    const total = Math.round(materialsPct * 0.35 + activitiesPct * 0.25 + quizzesPct * 0.25 + forumsPct * 0.1 + attendancePct * 0.05);

    await db
      .update(schema.enrollments)
      .set({ progressPercent: total, status: total >= 100 ? "finalizado" : "en_curso", completedAt: total >= 100 ? new Date() : null })
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)));

    return total;
  }

  /* ------------------------------------------------------------------ */
  /* SIMULACIÓN DE INSCRIPCIONES E INTERACCIÓN                          */
  /* ------------------------------------------------------------------ */
  type SimOptions = {
    fraction: number; // 0..1 de avance simulado
    finalExamPass?: boolean; // fuerza aprobar/reprobar el examen final si se rinde
    overrideStatus?: (typeof schema.enrollmentStatusEnum.enumValues)[number];
    pendingManualGrading?: boolean; // deja una entrega/respuesta sin corregir (para mostrar el flujo docente)
  };

  async function enrollAndSimulate(userId: string, courseIndex: number, opts: SimOptions) {
    const course = courses[courseIndex];
    const content = contentByCourse[courseIndex];
    const teacherId = teachers[COURSE_TEACHERS[courseIndex][0]].id;

    const [enrollment] = await db
      .insert(schema.enrollments)
      .values({ userId, courseId: course.id, status: "inscripto" })
      .returning();

    if (opts.fraction <= 0) {
      if (opts.overrideStatus) {
        await db.update(schema.enrollments).set({ status: opts.overrideStatus }).where(eq(schema.enrollments.id, enrollment.id));
      }
      return;
    }

    // Materiales
    const materialsToComplete = content.mandatoryMaterialIds.slice(0, Math.round(content.mandatoryMaterialIds.length * opts.fraction));
    if (materialsToComplete.length) {
      await db.insert(schema.userProgress).values(
        materialsToComplete.map((contentId) => ({
          userId, courseId: course.id, contentType: "material" as const, contentId, completed: true, completedAt: new Date(),
        }))
      );
    }

    // Actividades (entregas)
    const activitiesToSubmit = content.mandatoryActivityIds.slice(0, Math.round(content.mandatoryActivityIds.length * opts.fraction));
    if (activitiesToSubmit.length) {
      await db.insert(schema.submissions).values(
        activitiesToSubmit.map((activityId, i) => {
          const isLastPending = opts.pendingManualGrading && i === activitiesToSubmit.length - 1;
          return {
            activityId,
            studentId: userId,
            textContent: "Entrega realizada según las consignas indicadas en la actividad.",
            status: isLastPending ? ("entregado" as const) : ("calificado" as const),
            grade: isLastPending ? null : randInt(65, 100),
            feedback: isLastPending ? null : "Buen trabajo, cumple con lo solicitado.",
            submittedAt: daysFrom(course.startDate ?? new Date(), randInt(3, 30)),
            gradedAt: isLastPending ? null : daysFrom(course.startDate ?? new Date(), randInt(4, 32)),
            gradedBy: isLastPending ? null : teacherId,
          };
        })
      );
    }

    // Evaluaciones
    const quizPlan: { quizId: string; isFinal: boolean }[] = [];
    if (opts.fraction >= 0.4) quizPlan.push({ quizId: content.regularQuizId, isFinal: false });
    if (opts.fraction >= 0.8) quizPlan.push({ quizId: content.finalQuizId, isFinal: true });

    for (const { quizId, isFinal } of quizPlan) {
      const passingPercent = isFinal ? content.finalQuizPassingPercent : 60;
      const forcedPass = isFinal ? opts.finalExamPass : undefined;
      const passed = forcedPass !== undefined ? forcedPass : Math.random() > 0.2;
      const scorePercent = passed ? randInt(passingPercent, 100) : randInt(20, Math.max(21, passingPercent - 5));

      const pendingGrading = opts.pendingManualGrading && isFinal;
      const [attempt] = await db
        .insert(schema.quizAttempts)
        .values({
          quizId,
          studentId: userId,
          attemptNumber: 1,
          startedAt: daysFrom(course.startDate ?? new Date(), randInt(20, 45)),
          submittedAt: daysFrom(course.startDate ?? new Date(), randInt(20, 45)),
          timeUsedSeconds: randInt(300, 1500),
          scorePercent: pendingGrading ? null : scorePercent,
          passed: pendingGrading ? null : passed,
        })
        .returning();

      if (pendingGrading) {
        // Deja una respuesta de desarrollo sin corregir, para el flujo docente de corrección manual.
        const openQuestion = await db.query.questions.findFirst({
          where: and(eq(schema.questions.courseId, course.id), eq(schema.questions.type, "respuesta_desarrollada")),
        });
        if (openQuestion) {
          await db.insert(schema.answers).values({
            attemptId: attempt.id,
            questionId: openQuestion.id,
            textAnswer: "En mi puesto de trabajo aplicaría estos conceptos revisando primero los procesos actuales y proponiendo mejoras concretas al equipo.",
            isCorrect: null,
            manuallyGraded: false,
          });
        }
      }
    }

    // Foro
    if (opts.fraction >= 0.3) {
      await db.insert(schema.forumPosts).values({
        forumId: content.forumId,
        userId,
        content: "¡Hola a todos! Comparto mi experiencia con este tema en mi organismo, me pareció muy útil el enfoque del curso.",
        createdAt: daysFrom(course.startDate ?? new Date(), randInt(5, 40)),
      });
    }

    // Asistencia
    if (content.attendanceSessionIds.length) {
      const presentCount = Math.round(content.attendanceSessionIds.length * opts.fraction);
      await db.insert(schema.attendance).values(
        content.attendanceSessionIds.map((sessionId, i) => ({
          sessionId,
          studentId: userId,
          status: i < presentCount ? ("presente" as const) : (Math.random() > 0.5 ? ("ausente" as const) : ("justificado" as const)),
        }))
      );
    }

    await recomputeCourseProgress(userId, course.id);

    if (opts.overrideStatus) {
      await db.update(schema.enrollments).set({ status: opts.overrideStatus }).where(eq(schema.enrollments.id, enrollment.id));
    }
  }

  async function issueCertificate(userId: string, courseIndex: number) {
    const course = courses[courseIndex];
    let code = randomCode(10);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.query.certificates.findFirst({ where: eq(schema.certificates.code, code) });
      if (!existing) break;
      code = randomCode(10);
    }
    const teacherId = teachers[COURSE_TEACHERS[courseIndex][0]];
    await db.insert(schema.certificates).values({
      userId,
      courseId: course.id,
      code,
      hoursTotal: course.durationHours,
      teacherName: `${teacherId.firstName} ${teacherId.lastName}`,
      institution: INSTITUTION,
      issuedAt: daysFrom(course.endDate ?? new Date(), 1),
    });
    await db.update(schema.enrollments).set({ status: "aprobado" }).where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, course.id)));
  }

  console.log("🎓 Inscribiendo a la cuenta demo del alumno...");
  // Curso 0 (finalizado, dictado por el profesor demo): 100%, listo para pedir certificado en vivo.
  await enrollAndSimulate(demoStudent.id, 0, { fraction: 1, finalExamPass: true });
  // Curso 1 (finalizado): no llegó a aprobar el examen final -> desaprobado.
  await enrollAndSimulate(demoStudent.id, 1, { fraction: 0.7, finalExamPass: false, overrideStatus: "desaprobado" });
  // Curso 2 (activo, dictado por el profesor demo): en curso, con una entrega y un examen final pendientes de corrección.
  await enrollAndSimulate(demoStudent.id, 2, { fraction: 0.55, pendingManualGrading: true });
  // Curso 4 (a punto de comenzar): inscripto, sin avance todavía.
  await enrollAndSimulate(demoStudent.id, 4, { fraction: 0 });
  // Cursos 3 y 5 quedan sin inscripción para poder probar la autoinscripción desde el catálogo.

  console.log("🧑‍🎓 Generando inscripciones para el resto de los alumnos...");
  for (let si = 1; si < students.length; si++) {
    const student = students[si];
    const numCourses = randInt(1, 3);
    const courseIdxPool = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, numCourses);

    for (const ci of courseIdxPool) {
      const def = COURSE_DEFS[ci];
      if (def.phase === "upcoming") {
        await enrollAndSimulate(student.id, ci, {
          fraction: 0,
          overrideStatus: pickWeighted<(typeof schema.enrollmentStatusEnum.enumValues)[number]>([
            ["preinscripto", 1],
            ["inscripto", 2],
          ]),
        });
      } else if (def.phase === "finished") {
        const outcome = pickWeighted<"aprobado" | "finalizado" | "desaprobado" | "abandono">([
          ["aprobado", 4],
          ["finalizado", 2],
          ["desaprobado", 2],
          ["abandono", 2],
        ]);
        if (outcome === "aprobado") {
          await enrollAndSimulate(student.id, ci, { fraction: 1, finalExamPass: true });
          if (Math.random() > 0.3) await issueCertificate(student.id, ci);
        } else if (outcome === "finalizado") {
          await enrollAndSimulate(student.id, ci, { fraction: 1, finalExamPass: true });
        } else if (outcome === "desaprobado") {
          await enrollAndSimulate(student.id, ci, { fraction: randInt(55, 85) / 100, finalExamPass: false, overrideStatus: "desaprobado" });
        } else {
          await enrollAndSimulate(student.id, ci, { fraction: randInt(15, 40) / 100, overrideStatus: "abandono" });
        }
      } else {
        // activo
        const outcome = pickWeighted<"en_curso" | "inscripto" | "preinscripto">([
          ["en_curso", 6],
          ["inscripto", 3],
          ["preinscripto", 1],
        ]);
        if (outcome === "en_curso") {
          await enrollAndSimulate(student.id, ci, { fraction: randInt(15, 85) / 100 });
        } else {
          await enrollAndSimulate(student.id, ci, { fraction: 0, overrideStatus: outcome });
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* INSTITUCIÓN DEMO                                                    */
  /* ------------------------------------------------------------------ */
  // Le delegamos el curso 3 ("Herramientas de Ofimática Avanzada"), su
  // profesor y sus alumnos ya inscriptos a una institución de demostración,
  // para que institucion@capacita.demo tenga contenido real para explorar
  // sin dejar de tocar las cuentas demo de admin/profesor/alumno.
  console.log("🏫 Creando institución de demostración...");
  const [demoInstitution] = await db
    .insert(schema.institutions)
    .values({
      name: "Municipalidad de Ejemplo",
      slug: "municipalidad-de-ejemplo",
      contactEmail: "contacto@municipalidad-ejemplo.demo",
      active: true,
    })
    .returning();

  await db.insert(schema.users).values({
    firstName: "Institución",
    lastName: "Demo",
    email: "institucion@capacita.demo",
    passwordHash,
    role: "institution",
    institutionId: demoInstitution.id,
    organization: demoInstitution.name,
    active: true,
  });

  const delegatedCourse = courses[3];
  const delegatedTeacher = teachers[3];
  await db.update(schema.courses).set({ institutionId: demoInstitution.id }).where(eq(schema.courses.id, delegatedCourse.id));
  await db.update(schema.users).set({ institutionId: demoInstitution.id }).where(eq(schema.users.id, delegatedTeacher.id));

  const delegatedEnrollments = await db.query.enrollments.findMany({ where: eq(schema.enrollments.courseId, delegatedCourse.id) });
  if (delegatedEnrollments.length) {
    await db
      .update(schema.users)
      .set({ institutionId: demoInstitution.id })
      .where(inArray(schema.users.id, delegatedEnrollments.map((e) => e.userId)));
  }

  /* ------------------------------------------------------------------ */
  /* NOTIFICACIONES Y MENSAJES DE MUESTRA                                */
  /* ------------------------------------------------------------------ */
  console.log("🔔 Generando notificaciones y mensajes de muestra...");
  await db.insert(schema.notifications).values([
    { userId: demoStudent.id, type: "nueva_actividad", title: "Nueva actividad publicada", message: `Se publicó una nueva actividad en "${courses[2].name}".`, link: `/alumno/cursos/${courses[2].id}`, channel: "in_app" },
    { userId: demoStudent.id, type: "certificado_emitido", title: "¡Certificado disponible!", message: `Ya podés solicitar tu certificado de "${courses[0].name}".`, link: "/alumno/certificados", channel: "in_app" },
    { userId: demoStudent.id, type: "inicio_curso", title: "Tu curso está por comenzar", message: `"${courses[4].name}" comienza pronto.`, link: `/alumno/cursos/${courses[4].id}`, channel: "in_app" },
    { userId: demoTeacher.id, type: "general", title: "Entregas pendientes de corrección", message: `Tenés entregas y evaluaciones pendientes de corregir en "${courses[2].name}".`, link: `/profesor/cursos/${courses[2].id}`, channel: "in_app" },
  ]);

  await db.insert(schema.messages).values([
    {
      senderId: demoTeacher.id,
      courseId: courses[2].id,
      scope: "curso",
      subject: "Bienvenida al curso",
      body: "¡Hola a todos/as! Les damos la bienvenida al curso. Cualquier consulta pueden dejarla en el foro o escribirme directamente.",
    },
    {
      senderId: demoStudent.id,
      recipientId: demoTeacher.id,
      courseId: courses[2].id,
      scope: "alumno",
      subject: "Consulta sobre la actividad 2",
      body: "Hola, tengo una duda sobre el caso práctico de la Actividad 2. ¿Podría darme una orientación?",
    },
  ]);

  /* ------------------------------------------------------------------ */
  /* AUDITORÍA                                                          */
  /* ------------------------------------------------------------------ */
  await db.insert(schema.activityLogs).values([
    { userId: admin.id, action: "seed_completed", entityType: "system", metadata: { note: "Base de datos de demostración generada" } },
  ]);

  const enrollmentCount = await db.select({ count: sql<number>`count(*)::int` }).from(schema.enrollments);
  const certCount = await db.select({ count: sql<number>`count(*)::int` }).from(schema.certificates);

  console.log("\n✅ Seed completo.");
  console.log(`   Usuarios: 1 admin, ${teachers.length} profesores, ${students.length} alumnos`);
  console.log(`   Categorías: ${categories.length} · Programas: ${programs.length} · Cursos: ${courses.length}`);
  console.log(`   Inscripciones: ${enrollmentCount[0].count} · Certificados: ${certCount[0].count}`);
  console.log("\n   Cuentas demo (contraseña: Demo1234!):");
  console.log("   - admin@capacita.demo");
  console.log("   - profesor@capacita.demo");
  console.log("   - alumno@capacita.demo");
  console.log("   - institucion@capacita.demo (rol Institución, administra 1 curso propio)");
}

main()
  .then(() => {
    console.log("\n🌱 Listo.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error durante el seed:", err);
    process.exit(1);
  });
