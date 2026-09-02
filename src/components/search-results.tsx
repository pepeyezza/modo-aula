import Link from "next/link";
import { BookOpen, User as UserIcon, FileText, Award } from "lucide-react";
import { globalSearch } from "@/actions/search.actions";
import { Card } from "@/components/ui/card";

export async function SearchResults({ query, basePath, role }: { query: string; basePath: string; role: string }) {
  if (!query.trim()) {
    return <p className="text-sm text-[var(--muted-foreground)]">Escribí un término para buscar.</p>;
  }
  const results = await globalSearch(query);

  return (
    <div className="space-y-6">
      <Section title="Cursos" icon={BookOpen} empty={results.courses.length === 0}>
        {results.courses.map((c) => (
          <Link key={c.id} href={`${basePath}/cursos/${c.id}`} className="block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]">
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">{c.description}</div>
          </Link>
        ))}
      </Section>

      {role === "admin" && (
        <Section title="Usuarios" icon={UserIcon} empty={results.users.length === 0}>
          {results.users.map((u) => (
            <Link key={u.id} href={`/admin/usuarios?q=${u.email}`} className="block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]">
              <div className="font-medium">{u.firstName} {u.lastName}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{u.email} · {u.role}</div>
            </Link>
          ))}
        </Section>
      )}

      <Section title="Materiales" icon={FileText} empty={results.materials.length === 0}>
        {results.materials.map((m) => (
          <Link
            key={m.id}
            href={`${basePath}/cursos/${m.lesson.module.course.id}`}
            className="block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]"
          >
            <div className="font-medium">{m.title}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{m.lesson.module.course.name}</div>
          </Link>
        ))}
      </Section>

      {role === "admin" && (
        <Section title="Certificados" icon={Award} empty={results.certificates.length === 0}>
          {results.certificates.map((c) => (
            <Link key={c.id} href={`/verificar-certificado?codigo=${c.code}`} target="_blank" className="block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--muted)]">
              <div className="font-medium font-mono">{c.code}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{c.user.firstName} {c.user.lastName} · {c.course?.name}</div>
            </Link>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-[var(--primary)]" /> {title}
      </div>
      {empty ? (
        <p className="text-sm text-[var(--muted-foreground)]">Sin resultados</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </Card>
  );
}
