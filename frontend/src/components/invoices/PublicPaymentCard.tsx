import { CheckCircle2, ArrowRight, Download, ShieldCheck, Loader2, Lock, RotateCcw, XCircle, X, CreditCard, Wallet, QrCode } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PublicPaymentCardProps {
  isCreator: boolean;
  status: string;
  isVerifying: boolean;
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
              <h3 className="text-lg font-bold tracking-tight text-foreground">{t("payment_verifying_title")}</h3>
              <p className="text-sm font-semibold text-primary">{t("payment_verifying_reassure")}</p>
              <p className="text-xs text-muted-foreground max-w-70 mx-auto leading-relaxed">{t("payment_verifying_desc")}</p>
            </div>

            <div className="w-full space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 opacity-60">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="text-left text-xs font-medium text-muted-foreground flex-1 truncate">
                  UPI inside Razorpay locked during verification
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
                      <h4 className="text-sm font-bold text-destructive">{t("payment_failed_title")}</h4>
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
                    <p className="mt-2 text-xs font-medium text-foreground">{t("payment_failed_reassure")}</p>
                  </div>
                </div>
              </div>
            )}

            {true ? (
              <>
                <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center animate-fade-in">
                  {status === "PAID" ? (
                    <div className="flex flex-col items-center gap-2 text-success py-3">
                      <CheckCircle2 className="h-12 w-12" />
                      <span className="text-sm font-bold">Payment Complete</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Secure Razorpay Payment
                      </div>
                      <div className="text-lg font-bold mt-1 text-foreground">
                        Pay via QR, Card or Netbanking
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        We support Google Pay, Cards, Netbanking, and Wallets for automatic verification.
                      </p>

                      {/* Visual payment chips */}
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          <QrCode className="h-3 w-3 shrink-0 text-primary" />
                          QR Code
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          <CreditCard className="h-3 w-3 shrink-0 text-primary" />
                          Cards
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          <Wallet className="h-3 w-3 shrink-0 text-primary" />
                          Netbanking & Wallets
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  {status === "PAID" ? (
                    <div className="w-full rounded-xl bg-success/10 text-success py-3 text-center font-bold">
                      Payment Complete
                    </div>
                  ) : (
                    <button
                      onClick={initiateOnlinePayment}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-glow hover:scale-[1.02] transition-all ${
                        showFailure
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {showFailure ? t("payment_failed_retry") : "Pay via Razorpay"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {status !== "PAID" && (
                  <div className="mt-4 rounded-2xl border border-warning/20 bg-warning-soft/30 p-3.5 text-xs text-warning-foreground leading-relaxed animate-fade-in flex flex-col gap-1">
                    <div className="font-bold flex items-center gap-1.5 text-warning-foreground/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                      {t("payment_trouble_title")}
                    </div>
                    <p className="text-muted-foreground/90 font-medium">{t("payment_trouble_desc")}</p>
                  </div>
                )}
              </>
            ) : (
              status === "PAID" ? (
                <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center animate-fade-in">
                  <div className="flex flex-col items-center gap-2 text-success py-3">
                    <CheckCircle2 className="h-12 w-12" />
                    <span className="text-sm font-bold">Payment Complete</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground p-5 rounded-2xl border border-dashed border-border mb-2 bg-muted/5 leading-relaxed">
                  Online payments are not enabled for this invoice. Please contact the merchant.
                </div>
              )
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

      {inv.paymentLink && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card flex items-center gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="h-9 w-9 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-xs leading-relaxed">
            <div className="font-semibold text-foreground">256-bit secure payment</div>
            <div className="text-muted-foreground">Powered by Razorpay - PCI-DSS compliant</div>
          </div>
        </div>
      )}
    </div>
  );
}
