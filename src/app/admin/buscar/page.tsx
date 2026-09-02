import { SearchResults } from "@/components/search-results";

export default async function AdminBuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Resultados para &quot;{q}&quot;</h1>
      <SearchResults query={q ?? ""} basePath="/admin" role="admin" />
    </div>
  );
}
