import { CheckCircle2, Copy, ArrowRight, Download, ShieldCheck, Loader2, Lock, RotateCcw, XCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PublicPaymentCardProps {
  isCreator: boolean;
  status: string;
  isVerifying: boolean;
  qrUrl: string;
  copy: () => void;
  copied: boolean;
  upiId: string;
  inv: any;
  downloadPDF: () => void;
  initiateOnlinePayment: () => void;
  canResetLock?: boolean;
  resetPaymentLock?: () => void;
  paymentFailure?: { reason: string; code: string | null } | null;
  dismissPaymentFailure?: () => void;
}

export function PublicPaymentCard({
  isCreator,
  status,
  isVerifying,
  qrUrl,
  copy,
  copied,
  upiId,
  inv,
  downloadPDF,
  initiateOnlinePayment,
  canResetLock,
  resetPaymentLock,
  paymentFailure,
  dismissPaymentFailure,
}: PublicPaymentCardProps) {
  const { t } = useTranslation();
  if (isCreator) return null;

  // Show the failure banner only when we are NOT currently verifying. The verifying
  // state has higher priority because a fresh attempt is in flight.
  const showFailure = !isVerifying && !!paymentFailure && status !== "PAID";

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="rounded-3xl bg-card border border-border shadow-pop p-6 animate-scale-in" style={{ animationDelay: "120ms" }}>
        
        {isVerifying ? (
          <div className="py-8 flex flex-col items-center text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-primary/10 rounded-full animate-ping" />
              <div className="relative h-12 w-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center shadow-card">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                {t("payment_verifying_title")}
              </h3>
              <p className="text-sm font-semibold text-primary">
                {t("payment_verifying_reassure")}
              </p>
              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                {t("payment_verifying_desc")}
              </p>
            </div>

            {/* Locked-options panel makes it visually obvious that paying again is disabled. */}
            <div className="w-full space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 opacity-60">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="text-left text-xs font-medium text-muted-foreground flex-1 truncate">
                  {t("payment_locked_upi")}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 opacity-60">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="text-left text-xs font-medium text-muted-foreground flex-1 truncate">
                  {t("payment_locked_qr")}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 opacity-60">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="text-left text-xs font-medium text-muted-foreground flex-1 truncate">
                  {t("payment_locked_razorpay")}
                </div>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-border/60 flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                {t("payment_waiting_gateway")}
              </div>

              {canResetLock && resetPaymentLock && (
                <button
                  onClick={resetPaymentLock}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("payment_reset_lock")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {showFailure && (
              <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-destructive">
                        {t("payment_failed_title")}
                      </h4>
                      {dismissPaymentFailure && (
                        <button
                          onClick={dismissPaymentFailure}
                          aria-label="Dismiss"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {paymentFailure?.reason || t("payment_failed_generic")}
                    </p>
                    {paymentFailure?.code && (
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                        {t("payment_failed_code")}: {paymentFailure.code}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-medium text-foreground">
                      {t("payment_failed_reassure")}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
              className="mt-5 w-full group flex items-center justify-between rounded-xl border border-border bg-muted/40 hover:bg-accent transition-colors px-3.5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">UPI ID</div>
                <div className="text-sm font-mono font-medium">{upiId}</div>
              </div>
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${copied ? "bg-success text-success-foreground scale-110" : "bg-card text-muted-foreground"}`}>
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </span>
            </button>

            <div className="mt-4">
              {status === "PAID" ? (
                <div className="w-full rounded-xl bg-success/10 text-success py-3 text-center font-bold">
                  Payment Complete
                </div>
              ) : inv.paymentLink ? (
                <button
                  onClick={initiateOnlinePayment}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-glow hover:scale-[1.02] transition-all ${
                    showFailure
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {showFailure ? t("payment_failed_retry") : "Pay via Razorpay (Online)"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="text-center text-xs text-muted-foreground p-4 rounded-xl border border-dashed border-border">
                  Online payment link not generated. Please contact the merchant.
                </div>
              )}
            </div>

            {status !== "PAID" && (
              <div className="mt-4 rounded-2xl border border-warning/20 bg-warning-soft/30 p-3.5 text-xs text-warning-foreground leading-relaxed animate-fade-in flex flex-col gap-1">
                <div className="font-bold flex items-center gap-1.5 text-warning-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                  {t("payment_trouble_title")}
                </div>
                <p className="text-muted-foreground/90 font-medium">
                  {t("payment_trouble_desc")}
                </p>
              </div>
            )}
          </>
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
