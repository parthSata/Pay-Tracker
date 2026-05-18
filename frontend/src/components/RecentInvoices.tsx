import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR, type InvoiceStatus } from "@/lib/mock";

interface RecentInvoicesProps {
  invoices: any[];
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden animate-fade-up" style={{ animationDelay: "380ms" }}>
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="text-base font-semibold">Recent invoices</h2>
          <p className="text-xs text-muted-foreground">Your latest activity</p>
        </div>
        <Link to="/invoices" className="text-xs font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No recent invoices.
          </div>
        ) : (
          invoices.slice(0, 5).map((inv) => (
            <div key={inv._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/40 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {inv.clientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{inv.clientName}</div>
                  <div className="text-xs text-muted-foreground truncate">{inv.invoiceNumber} · Due {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold tabular-nums">{formatINR(inv.amount)}</span>
                <StatusBadge status={inv.status.toLowerCase() as InvoiceStatus} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
