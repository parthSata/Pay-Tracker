import { Sparkles } from "lucide-react";
import { formatINR } from "@/lib/mock";

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
              <div className="text-sm font-semibold">{user?.businessName || user?.name || "Business Merchant"}</div>
              <div className="text-[11px] text-muted-foreground">{user?.email || "hello@merchant.in"}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</div>
              <div className="font-mono text-sm font-semibold">#INV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-border">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bill to</div>
              <div className="text-sm font-medium">{client || "Client name"}</div>
              <div className="text-xs text-muted-foreground">{email || "client@email.com"}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due</div>
              <div className="text-sm font-medium">
                {due ? new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{user?.gstEnabled ? "Taxable Amount" : "Subtotal"}</span>
              <span className="tabular-nums">{formatINR(amountNum)}</span>
            </div>
            {taxType === "CGST_SGST" ? (
              <>
                <div className="flex justify-between text-[11px] text-muted-foreground/80 pl-2">
                  <span>CGST ({gstRate / 2}%)</span>
                  <span className="tabular-nums">{formatINR(gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground/80 pl-2">
                  <span>SGST ({gstRate / 2}%)</span>
                  <span className="tabular-nums">{formatINR(gstAmount / 2)}</span>
                </div>
              </>
            ) : taxType === "IGST" ? (
              <div className="flex justify-between text-[11px] text-muted-foreground/80 pl-2">
                <span>IGST ({gstRate}%)</span>
                <span className="tabular-nums">{formatINR(gstAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
              <span>{user?.gstEnabled ? "Total (Incl. Tax)" : "Total Amount"}</span>
              <span className="tabular-nums text-primary">{formatINR(total)}</span>
            </div>
          </div>

          {notes && (
            <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground italic">
              "{notes}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
