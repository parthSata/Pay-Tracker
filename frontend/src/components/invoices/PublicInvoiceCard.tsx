import { ExternalLink, QrCode } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface PublicInvoiceCardProps {
  inv: any;
  total: number;
  status: string;
  paymentLinkQrUrl?: string;
  openPaymentLink?: () => void;
}

export function PublicInvoiceCard({
  inv,
  total,
  status,
  paymentLinkQrUrl,
  openPaymentLink,
}: PublicInvoiceCardProps) {
  const showQrSection = status !== "PAID" && !!inv?.paymentLink && !!paymentLinkQrUrl;

  return (
    <div id="invoice-card" className="min-w-0 space-y-6">
      <div className="animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-pop lg:p-8">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 rounded-2xl border border-border bg-muted/10 p-5">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Merchant Details
            </div>
            <div className="gradient-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold uppercase text-white">
              {(inv.userId?.businessName || inv.userId?.name || "B")
                .split(" ")
                .map((n: any) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="break-words text-lg font-bold tracking-tight">
              {inv.userId?.businessName || "Business Merchant"}
            </div>
            <div className="break-words text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {inv.userId?.name}
              {inv.userId?.gstNumber ? ` · GST: ${inv.userId.gstNumber}` : ""}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-border bg-muted/10 p-5 text-left sm:max-w-[40%] sm:text-right">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Invoice Details
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</div>
            <div className="break-all font-mono text-base font-semibold">{inv.invoiceNumber}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Issued{" "}
              {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {showQrSection && (
          <div className="mb-6 rounded-2xl border border-border bg-muted/10 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 max-w-xl">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <QrCode className="h-4 w-4" />
                  Payment QR Section
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Scan and pay from another device
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  This payment section is separate from the merchant details. Use the QR code or open the Razorpay link directly.
                </p>
                {openPaymentLink && (
                  <button
                    onClick={openPaymentLink}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Payment Link
                  </button>
                )}
              </div>

              <div className="mx-auto w-full max-w-[240px] rounded-2xl border border-border bg-white p-3 shadow-card lg:mx-0">
                <img
                  src={paymentLinkQrUrl}
                  alt="Razorpay payment QR code"
                  className="mx-auto aspect-square w-full max-w-[200px] object-contain"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 border-y border-border py-5 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Bill to</div>
            <div className="break-words text-sm font-semibold">{inv.clientName}</div>
            <div className="break-all text-xs text-muted-foreground">{inv.clientEmail}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Due date</div>
            <div className="text-sm font-semibold">
              {new Date(inv.dueDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2 py-5 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Taxable Value</span>
            <span className="break-all text-right font-medium tabular-nums">{formatINR(inv.amount)}</span>
          </div>
          {inv.taxType === "CGST_SGST" ? (
            <>
              <div className="flex items-start justify-between gap-4 pl-4 text-xs text-muted-foreground/80">
                <span className="shrink-0">CGST ({inv.gstRate / 2}%)</span>
                <span className="break-all text-right tabular-nums">{formatINR(inv.cgst)}</span>
              </div>
              <div className="flex items-start justify-between gap-4 pl-4 text-xs text-muted-foreground/80">
                <span className="shrink-0">SGST ({inv.gstRate / 2}%)</span>
                <span className="break-all text-right tabular-nums">{formatINR(inv.sgst)}</span>
              </div>
            </>
          ) : inv.taxType === "IGST" ? (
            <div className="flex items-start justify-between gap-4 pl-4 text-xs text-muted-foreground/80">
              <span className="shrink-0">IGST ({inv.gstRate}%)</span>
              <span className="break-all text-right tabular-nums">{formatINR(inv.igst)}</span>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 rounded-2xl bg-secondary p-5 text-secondary-foreground">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider opacity-70">Amount due</div>
              <div className="mt-1 break-all text-3xl font-semibold tracking-tight tabular-nums">
                {formatINR(total)}
              </div>
            </div>
            <div className="shrink-0 text-left text-[11px] opacity-70 sm:text-right">
              Status
              <br />
              <span
                className={`font-medium uppercase tracking-wider ${
                  status === "PAID" ? "text-success" : "text-primary"
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
