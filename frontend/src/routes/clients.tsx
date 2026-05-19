import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useClientRisk } from "@/hooks/useClientRisk";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientFilterTabs } from "@/components/clients/ClientFilterTabs";
import { 
  Users, 
  Search, 
  Inbox
} from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Client Risk Scoring — Pay Tracker" },
      { name: "description", content: "Analyze client payment patterns, late frequencies, and risk profiles." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { 
    clients, 
    loading, 
    search, 
    setSearch, 
    filter, 
    setFilter, 
    counts 
  } = useClientRisk();

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto animate-fade-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" /> Client Risk Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Leverage historical payment frequencies, delay days, and unpaid ratios to assess risk.
            </p>
          </div>

          {/* Quick Stats Overview */}
          <ClientFilterTabs 
            filter={filter} 
            onChange={setFilter} 
            counts={counts} 
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card mb-6">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search by client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground text-sm flex-1 bg-transparent"
          />
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="bg-card border border-border rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-40" />
                    <div className="h-3 bg-muted rounded w-48" />
                  </div>
                  <div className="h-6 bg-muted rounded-full w-24" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  {[1, 2, 3].map(col => (
                    <div key={col} className="space-y-1">
                      <div className="h-3 bg-muted rounded w-16" />
                      <div className="h-5 bg-muted rounded w-10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-3xl shadow-card text-center animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-accent-soft flex items-center justify-center text-primary mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">No clients found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              We couldn't find any clients matching your search criteria or risk filters.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {clients.map((client) => (
              <ClientCard key={client.clientEmail} client={client} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
