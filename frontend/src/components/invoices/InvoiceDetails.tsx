import { formatINR } from "@/lib/utils";

interface InvoiceDetailsProps {
  inv: any;
  upiId: string;
  total: number;
}

export function InvoiceDetails({ inv, upiId, total }: InvoiceDetailsProps) {


  return (
    <div className="rounded-3xl bg-card border border-border shadow-card p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase shadow-inner">
            {(inv.sme?.businessName || "B")[0]}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold tracking-tight break-words">{inv.sme?.businessName || "Business Merchant"}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider break-words">{inv.sme?.name}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Invoice Record</div>
          <div className="font-mono text-xl font-black break-all">{inv.invoiceNumber}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 py-6 border-y border-border/50 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Sender Information</div>
          <div className="text-sm font-bold text-foreground break-words">{inv.sme?.businessName}</div>
          <div className="text-xs text-muted-foreground break-all">{inv.sme?.email}</div>
          <div className="text-xs text-muted-foreground font-mono break-all">UPI: {upiId}</div>
          {inv.sme?.gstNumber && <div className="text-[10px] text-primary font-bold mt-1 break-all">GST: {inv.sme.gstNumber}</div>}
        </div>
        <div className="text-right space-y-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">My Information</div>
          <div className="text-sm font-bold text-foreground break-words">{inv.clientName}</div>
          <div className="text-xs text-muted-foreground break-all">{inv.clientEmail}</div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase mt-2 max-w-full">
            <span className="truncate">Due {new Date(inv.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="py-6 space-y-3">
        <div className="flex justify-between items-start gap-4 text-sm">
          <span className="text-muted-foreground font-medium shrink-0">Taxable Value</span>
          <span className="tabular-nums font-bold break-all text-right">{formatINR(inv.amount)}</span>
        </div>
        {inv.taxType === "CGST_SGST" ? (
          <>
            <div className="flex justify-between items-start gap-4 text-[11px] text-muted-foreground/80 pl-4">
              <span className="shrink-0">CGST ({inv.gstRate / 2}%)</span>
              <span className="tabular-nums break-all text-right">{formatINR(inv.cgst)}</span>
            </div>
            <div className="flex justify-between items-start gap-4 text-[11px] text-muted-foreground/80 pl-4">
              <span className="shrink-0">SGST ({inv.gstRate / 2}%)</span>
              <span className="tabular-nums break-all text-right">{formatINR(inv.sgst)}</span>
            </div>
          </>
        ) : inv.taxType === "IGST" ? (
          <div className="flex justify-between items-start gap-4 text-[11px] text-muted-foreground/80 pl-4">
            <span className="shrink-0">IGST ({inv.gstRate}%)</span>
            <span className="tabular-nums break-all text-right">{formatINR(inv.igst)}</span>
          </div>
        ) : null}
        <div className="pt-4 mt-2 border-t border-dashed border-border/60 flex justify-between items-center gap-4">
          <span className="text-base font-black uppercase tracking-tight shrink-0">Total Amount Due</span>
          <span className="text-3xl font-black tabular-nums text-primary break-all text-right">{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}
