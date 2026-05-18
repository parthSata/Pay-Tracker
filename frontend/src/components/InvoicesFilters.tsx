import { Search } from "lucide-react";

interface InvoicesFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  q: string;
  setQ: (q: string) => void;
  filters: string[];
  counts: Record<string, number>;
}

export function InvoicesFilters({ filter, setFilter, q, setQ, filters, counts }: InvoicesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
            filter === f
              ? "bg-secondary text-secondary-foreground border-secondary"
              : "bg-card text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          <span className="capitalize">{f}</span>
          <span className={`ml-2 text-[11px] ${filter === f ? "opacity-70" : "text-muted-foreground"}`}>
            {counts[f]}
          </span>
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 w-full sm:w-72 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by client or ID"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
