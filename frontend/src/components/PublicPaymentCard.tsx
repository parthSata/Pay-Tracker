import { CheckCircle2, Copy, ArrowRight, Download, ShieldCheck } from "lucide-react";

interface PublicPaymentCardProps {
  isCreator: boolean;
  status: string;
  qrUrl: string;
  copy: () => void;
  copied: boolean;
  upiId: string;
  inv: any;
  downloadPDF: () => void;
}

export function PublicPaymentCard({
  isCreator,
  status,
  qrUrl,
  copy,
  copied,
  upiId,
  inv,
  downloadPDF,
}: PublicPaymentCardProps) {
  if (isCreator) return null;

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="rounded-3xl bg-card border border-border shadow-pop p-6 animate-scale-in" style={{ animationDelay: "120ms" }}>
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Scan to pay</div>
          <div className="text-base font-semibold mt-1">UPI · GPay · PhonePe · Paytm</div>
        </div>

        <div className="mt-5 mx-auto w-52 h-52 rounded-2xl bg-white p-3 shadow-card animate-fade-in border border-border flex items-center justify-center overflow-hidden">
          {status === "PAID" ? (
            <div className="flex flex-col items-center gap-2 text-success">
              <CheckCircle2 className="h-12 w-12" />
              <span className="text-xs font-bold uppercase">Paid</span>
            </div>
          ) : (
            <img src={qrUrl} alt="Payment QR" className="w-full h-full object-contain" />
          )}
        </div>

        <button
          onClick={copy}
          disabled={status === "PAID"}
          className="mt-5 w-full group flex items-center justify-between rounded-xl border border-border bg-muted/40 hover:bg-accent transition-colors px-3.5 py-2.5 disabled:opacity-50"
        >
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">UPI ID</div>
            <div className="text-sm font-mono font-medium">{upiId}</div>
          </div>
          <span className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${copied ? "bg-success text-success-foreground scale-110" : "bg-card text-muted-foreground"}`}>
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </span>
        </button>

        {status === "PAID" ? (
          <div className="w-full rounded-xl bg-success/10 text-success py-3 text-center font-bold">
            Payment Complete
          </div>
        ) : inv.paymentLink ? (
          <button
            onClick={() => window.open(inv.paymentLink, "_blank")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-bold shadow-glow hover:scale-[1.02] transition-all"
          >
            Pay via Razorpay (Online)
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="text-center text-xs text-muted-foreground p-4 rounded-xl border border-dashed border-border">
            Online payment link not generated. Please contact the merchant.
          </div>
        )}

        <button
          onClick={downloadPDF}
          className="w-full mt-4 flex-1 border border-border bg-muted/30 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors print:hidden"
        >
          <Download className="h-5 w-5" />
          Download PDF
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card flex items-center gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="h-9 w-9 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="text-xs leading-relaxed">
          <div className="font-semibold text-foreground">256-bit secure payment</div>
          <div className="text-muted-foreground">Powered by Razorpay & UPI · PCI-DSS compliant</div>
        </div>
      </div>
    </div>
  );
}
