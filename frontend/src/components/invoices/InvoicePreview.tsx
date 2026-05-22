import { Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface InvoicePreviewProps {
  user: any;
  client: string;
  email: string;
  due: string;
  amountNum: number;
  taxType: string;
  gstRate: number;
  gstAmount: number;
  total: number;
  notes: string;
}

export function InvoicePreview({
  user,
  client,
  email,
  due,
  amountNum,
  taxType,
  gstRate,
  gstAmount,
  total,
  notes,
}: InvoicePreviewProps) {
  return (
    <div className="lg:col-span-2">
      <div className="sticky top-24 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Live preview
        </div>
        <div className="rounded-2xl bg-card border border-border shadow-pop p-6 transition-all">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="h-9 w-9 rounded-lg gradient-primary mb-2 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter">
                {(user?.businessName || user?.name || "B").split(" ").map((n: any) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="text-sm font-semibold break-words">{user?.businessName || user?.name || "Business Merchant"}</div>
              <div className="text-[11px] text-muted-foreground break-all">{user?.email || "hello@merchant.in"}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</div>
              <div className="font-mono text-sm font-semibold">#INV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-border">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bill to</div>
              <div className="text-sm font-medium break-words">{client || "Client name"}</div>
              <div className="text-xs text-muted-foreground break-all">{email || "client@email.com"}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due</div>
              <div className="text-sm font-medium">
                {due ? new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-start gap-4 text-muted-foreground">
              <span className="shrink-0">{user?.gstEnabled ? "Taxable Amount" : "Subtotal"}</span>
              <span className="tabular-nums break-all text-right">{formatINR(amountNum)}</span>
            </div>
            {taxType === "CGST_SGST" ? (
              <>
                <div className="flex justify-between items-start gap-4 text-[11px] text-muted-foreground/80 pl-2">
                  <span className="shrink-0">CGST ({gstRate / 2}%)</span>
                  <span className="tabular-nums break-all text-right">{formatINR(gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between items-start gap-4 text-[11px] text-muted-foreground/80 pl-2">
                  <span className="shrink-0">SGST ({gstRate / 2}%)</span>
                  <span className="tabular-nums break-all text-right">{formatINR(gstAmount / 2)}</span>
                </div>
              </>
            ) : taxType === "IGST" ? (
              <div className="flex justify-between items-start gap-4 text-[11px] text-muted-foreground/80 pl-2">
                <span className="shrink-0">IGST ({gstRate}%)</span>
                <span className="tabular-nums break-all text-right">{formatINR(gstAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between items-start gap-4 font-semibold text-base pt-2 border-t border-border">
              <span className="shrink-0">{user?.gstEnabled ? "Total (Incl. Tax)" : "Total Amount"}</span>
              <span className="tabular-nums text-primary break-all text-right">{formatINR(total)}</span>
            </div>
          </div>

          {notes && (
            <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground italic break-words">
              "{notes}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
