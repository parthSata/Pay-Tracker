import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices — Pay Tracker" },
      { name: "description", content: "All your invoices in one place — filter, sort and export." },
    ],
  }),
  component: InvoiceList,
});

import { useInvoicesList } from "@/hooks/useInvoicesList";
import { InvoicesHeader } from "@/components/invoices/InvoicesHeader";
import { InvoicesFilters } from "@/components/invoices/InvoicesFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";

function InvoiceList() {
  const {
    filter,
    setFilter,
    q,
    setQ,
    invoices,
    isLoading,
    rows,
    counts,
    handleExport,
    filters
  } = useInvoicesList();

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <InvoicesHeader invoicesCount={invoices.length} overdueCount={counts.overdue} handleExport={handleExport} />
        <InvoicesFilters filter={filter} setFilter={(f) => setFilter(f as any)} q={q} setQ={setQ} filters={filters} counts={counts} />
        <InvoicesTable rows={rows} isLoading={isLoading} />
      </div>
    </AppShell>
  );
}
