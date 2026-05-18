import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/invoices/received")({
  head: () => ({
    meta: [
      { title: "Received Invoices — Pay Tracker" },
      { name: "description", content: "Invoices sent to you by other businesses." },
    ],
  }),
  component: ReceivedInvoices,
});

import { useReceivedInvoices } from "@/hooks/useReceivedInvoices";
import { ReceivedInvoicesTable } from "@/components/ReceivedInvoicesTable";

function ReceivedInvoices() {
  const { invoices, isLoading } = useReceivedInvoices();

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Invoices sent to your email by other businesses on Pay Tracker.
            </p>
          </div>
        </div>

        <ReceivedInvoicesTable invoices={invoices} isLoading={isLoading} />
      </div>
    </AppShell>
  );
}
