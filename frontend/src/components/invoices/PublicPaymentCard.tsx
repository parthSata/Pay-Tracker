import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  Lock,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
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
  const showPaymentLink = status !== "PAID" && !!inv.paymentLink;

  return (
    <div className="min-w-0 xl:self-start">
      <div
        className="rounded-3xl border border-border bg-card p-4 shadow-pop animate-scale-in sm:p-5 lg:p-6"
        style={{ animationDelay: "120ms" }}
      >
        {isVerifying ? (
          <div className="flex flex-col items-center space-y-6 py-8 text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full bg-primary/10 animate-ping" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary shadow-card">
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
              <p className="mx-auto max-w-70 text-xs leading-relaxed text-muted-foreground">
                {t("payment_verifying_desc")}
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 opacity-60">
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 truncate text-left text-xs font-medium text-muted-foreground">
                  Razorpay Checkout locked during verification
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 opacity-60">
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 truncate text-left text-xs font-medium text-muted-foreground">
                  {t("payment_locked_razorpay")}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-3 border-t border-border/60 pt-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                {t("payment_waiting_gateway")}
              </div>

              {canResetLock && resetPaymentLock && (
                <button
                  onClick={resetPaymentLock}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-destructive">
                        {t("payment_failed_title")}
                      </h4>
                      {dismissPaymentFailure && (
                        <button
                          onClick={dismissPaymentFailure}
                          aria-label="Dismiss"
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {paymentFailure?.reason || t("payment_failed_generic")}
                    </p>
                    <p className="mt-2 text-xs font-medium text-foreground">
                      {paymentFailure?.reason === "Bank declined" &&
                        "The bank declined this payment. Please retry or use another payment method."}
                      {paymentFailure?.reason === "UPI timeout" &&
                        "The payment request timed out before completion. Please try again."}
                      {paymentFailure?.reason === "Insufficient balance" &&
                        "Your bank account did not have enough balance to complete the payment."}
                      {paymentFailure?.reason === "Payment cancelled" &&
                        "The payment was cancelled before it could be completed."}
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

            {status === "PAID" ? (
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center animate-fade-in">
                <div className="flex flex-col items-center gap-2 py-4 text-success">
                  <CheckCircle2 className="h-12 w-12" />
                  <span className="text-sm font-bold">Payment Complete</span>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-muted/20 p-5 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Secure Razorpay Payment
                      </div>
                      <div className="mt-1 text-lg font-bold leading-tight text-foreground">
                        Pay securely online
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Use Razorpay checkout for cards, netbanking, and
                        wallets. You can also open the secure payment link or
                        scan the QR code on another device.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      <CreditCard className="h-3 w-3 shrink-0" />
                      Cards
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      <Wallet className="h-3 w-3 shrink-0" />
                      Netbanking & Wallets
                    </span>
                    {showPaymentLink && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                        <QrCode className="h-3 w-3 shrink-0" />
                        QR + Link
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={initiateOnlinePayment}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:scale-[1.01] ${
                      showFailure
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "bg-primary text-primary-foreground shadow-glow"
                    }`}
                  >
                    {showFailure
                      ? t("payment_failed_retry")
                      : "Pay via Razorpay"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <div className="font-semibold text-foreground">
                        Secured by Razorpay
                      </div>
                      <div className="text-muted-foreground">
                        PCI-DSS compliant gateway
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <div className="font-semibold text-foreground">
                        SSL encrypted
                      </div>
                      <div className="text-muted-foreground">
                        Protected during payment
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <div className="font-semibold text-foreground">
                        No card data stored
                      </div>
                      <div className="text-muted-foreground">
                        Handled directly by Razorpay
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-warning/20 bg-warning-soft/30 p-3.5 text-xs leading-relaxed text-warning-foreground animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-warning-foreground/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                    {t("payment_trouble_title")}
                  </div>
                  <p className="mt-1 text-muted-foreground/90 font-medium">
                    {t("payment_trouble_desc")}
                  </p>
                </div>
              </>
            )}
          </>
        )}

        <button
          onClick={downloadPDF}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 py-3 font-bold transition-colors hover:bg-muted/50 print:hidden"
        >
          <Download className="h-5 w-5" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
