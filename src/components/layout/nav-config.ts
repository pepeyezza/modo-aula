import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  GraduationCap,
  ClipboardList,
  HelpCircle,
  MessageSquare,
  Award,
  BarChart3,
  Bell,
  Settings,
  UserCog,
  CalendarCheck,
  Trophy,
  Search,
  Building2,
  LayoutTemplate,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Inicio del sitio", href: "/admin/inicio", icon: LayoutTemplate },
  { label: "Instituciones", href: "/admin/instituciones", icon: Building2 },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users },
  { label: "Cursos", href: "/admin/cursos", icon: BookOpen },
  { label: "Programas", href: "/admin/programas", icon: Layers },
  { label: "Inscripciones", href: "/admin/inscripciones", icon: ClipboardList },
  { label: "Banco de preguntas", href: "/admin/banco-preguntas", icon: HelpCircle },
  { label: "Certificados", href: "/admin/certificados", icon: Award },
  { label: "Reportes", href: "/admin/reportes", icon: BarChart3 },
  { label: "Notificaciones", href: "/admin/notificaciones", icon: Bell },
  { label: "Gamificación", href: "/admin/gamificacion", icon: Trophy },
  { label: "Buscador", href: "/admin/buscar", icon: Search },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings },
];

export const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/profesor", icon: LayoutDashboard },
  { label: "Mis cursos", href: "/profesor/cursos", icon: BookOpen },
  { label: "Programas", href: "/profesor/programas", icon: Layers },
  { label: "Banco de preguntas", href: "/profesor/banco-preguntas", icon: HelpCircle },
  { label: "Mensajes", href: "/profesor/mensajes", icon: MessageSquare },
  { label: "Perfil", href: "/profesor/perfil", icon: UserCog },
];

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/alumno", icon: LayoutDashboard },
  { label: "Mis cursos", href: "/alumno/cursos", icon: BookOpen },
  { label: "Catálogo", href: "/alumno/catalogo", icon: GraduationCap },
  { label: "Mi progreso", href: "/alumno/progreso", icon: BarChart3 },
  { label: "Asistencia", href: "/alumno/asistencia", icon: CalendarCheck },
  { label: "Certificados", href: "/alumno/certificados", icon: Award },
  { label: "Mensajes", href: "/alumno/mensajes", icon: MessageSquare },
  { label: "Mi perfil", href: "/alumno/perfil", icon: UserCog },
];

export const INSTITUCION_NAV: NavItem[] = [
  { label: "Dashboard", href: "/institucion", icon: LayoutDashboard },
  { label: "Cursos", href: "/institucion/cursos", icon: BookOpen },
  { label: "Programas", href: "/institucion/programas", icon: Layers },
  { label: "Profesores", href: "/institucion/profesores", icon: UserCog },
  { label: "Alumnos", href: "/institucion/alumnos", icon: Users },
  { label: "Perfil", href: "/institucion/perfil", icon: Settings },
];

export type NavRole = "admin" | "teacher" | "student" | "institution";

// NOTA IMPORTANTE: los ítems de arriba incluyen componentes de ícono
// (funciones), así que este módulo solo debe importarse desde Client
// Components. Pasar `NavItem[]` como prop desde un Server Component (p. ej.
// un layout.tsx) a un componente "use client" rompe la serialización RSC
// ("Functions cannot be passed directly to Client Components"). Por eso los
// layouts de servidor pasan solo `role`, y los componentes de navegación
// ("use client": Sidebar, Topbar, MobileNav) resuelven la lista acá mismo.
export const NAV_BY_ROLE: Record<NavRole, NavItem[]> = {
  admin: ADMIN_NAV,
  teacher: TEACHER_NAV,
  student: STUDENT_NAV,
  institution: INSTITUCION_NAV,
};
