import { formatINR } from "@/lib/utils";

interface PublicInvoiceCardProps {
  inv: any;
  total: number;
  status: string;
}

export function PublicInvoiceCard({ inv, total, status }: PublicInvoiceCardProps) {
  return (
    <div id="invoice-card" className="lg:col-span-3 space-y-6">
      <div className="rounded-3xl bg-card border border-border shadow-pop p-6 lg:p-8 animate-fade-up">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="h-10 w-10 rounded-xl gradient-primary mb-3 flex items-center justify-center text-xs font-bold text-white uppercase">
              {(inv.userId?.businessName || inv.userId?.name || "B").split(" ").map((n: any) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="text-lg font-bold tracking-tight break-words">{inv.userId?.businessName || "Business Merchant"}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider break-words">
              {inv.userId?.name} {inv.userId?.gstNumber && `· GST: ${inv.userId.gstNumber}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</div>
            <div className="font-mono text-base font-semibold break-all">{inv.invoiceNumber}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Issued {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-5 border-y border-border">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Bill to</div>
            <div className="text-sm font-semibold break-words">{inv.clientName}</div>
            <div className="text-xs text-muted-foreground break-all">{inv.clientEmail}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Due date</div>
            <div className="text-sm font-semibold">
              {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="py-5 space-y-2 text-sm">
          <div className="flex justify-between items-start gap-4">
            <span className="text-muted-foreground shrink-0">Taxable Value</span>
            <span className="tabular-nums font-medium break-all text-right">{formatINR(inv.amount)}</span>
          </div>
          {inv.taxType === "CGST_SGST" ? (
            <>
              <div className="flex justify-between items-start gap-4 text-xs text-muted-foreground/80 pl-4">
                <span className="shrink-0">CGST ({inv.gstRate / 2}%)</span>
                <span className="tabular-nums break-all text-right">{formatINR(inv.cgst)}</span>
              </div>
              <div className="flex justify-between items-start gap-4 text-xs text-muted-foreground/80 pl-4">
                <span className="shrink-0">SGST ({inv.gstRate / 2}%)</span>
                <span className="tabular-nums break-all text-right">{formatINR(inv.sgst)}</span>
              </div>
            </>
          ) : inv.taxType === "IGST" ? (
            <div className="flex justify-between items-start gap-4 text-xs text-muted-foreground/80 pl-4">
              <span className="shrink-0">IGST ({inv.gstRate}%)</span>
              <span className="tabular-nums break-all text-right">{formatINR(inv.igst)}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-secondary text-secondary-foreground p-5 flex items-end justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider opacity-70">Amount due</div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums mt-1 break-all">{formatINR(total)}</div>
          </div>
          <div className="text-[11px] opacity-70 text-right shrink-0">
            Status<br />
            <span className={`font-medium uppercase tracking-wider ${status === 'PAID' ? 'text-success' : 'text-primary'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
