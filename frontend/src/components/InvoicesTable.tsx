import { Link } from "@tanstack/react-router";
import { Loader2, ArrowUpDown } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR, type InvoiceStatus } from "@/lib/mock";

interface InvoicesTableProps {
  rows: any[];
  isLoading: boolean;
}

export function InvoicesTable({ rows, isLoading }: InvoicesTableProps) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/60 backdrop-blur z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">
                <span className="inline-flex items-center gap-1">Amount <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="px-5 py-3 font-medium">Due date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading invoices...</p>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No invoices found.
                </td>
              </tr>
            ) : (
              rows.map((inv, idx) => (
                <tr
                  key={inv._id}
                  className="group hover:bg-accent/40 transition-colors animate-fade-up"
                  style={{ animationDelay: `${idx * 30}ms`, animationDuration: "300ms" }}
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center text-[11px] font-semibold">
                        {inv.clientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{inv.clientName}</div>
                        <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums">{formatINR(inv.totalAmount || inv.amount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={inv.status.toLowerCase() as InvoiceStatus} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to="/pay/$id"
                      params={{ id: inv._id }}
                      className="text-xs font-medium text-primary max-sm:opacity-100 opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
