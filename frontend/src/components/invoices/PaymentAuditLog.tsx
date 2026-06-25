import { CalendarDays, CheckCircle2, Clock3, RotateCcw, ShieldCheck, XCircle } from "lucide-react";

interface PaymentAuditAttempt {
  id?: string;
  attemptNumber: number;
  attemptedAt?: string;
  method?: string;
  status: "STARTED" | "FAILED" | "SUCCESS" | "RESET" | string;
  amount?: number;
  gateway?: string;
  gatewayPaymentId?: string;
  failureReason?: string;
  failureCode?: string;
  failureExplanation?: {
    title?: string;
    detail?: string;
  };
  source?: string;
}

interface RefundTrackingStage {
  key: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "failed" | string;
  date?: string;
}

interface PaymentAudit {
  status?: string;
  method?: string;
  paidAt?: string;
  retryCount?: number;
  refundStatus?: string;
  refundInitiatedAt?: string;
  refundUpdatedAt?: string;
  refundExpectedAt?: string;
  refundReference?: string;
  refundReason?: string;
  refundTracking?: {
    status?: string;
    initiatedAt?: string;
    expectedArrivalDate?: string;
    completedAt?: string;
    stages?: RefundTrackingStage[];
  } | null;
  attempts?: PaymentAuditAttempt[];
}

interface PaymentAuditLogProps {
  audit?: PaymentAudit;
  isCreator: boolean;
}

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number(amount || 0) % 1 === 0 ? 0 : 2,
  }).format(amount || 0);

const formatDate = (date?: string) => {
  if (!date) return "Not recorded";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const humanize = (value?: string) =>
  value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Not recorded";

const statusStyles: Record<string, string> = {
  STARTED: "bg-warning-soft text-warning",
  FAILED: "bg-destructive-soft text-destructive",
  SUCCESS: "bg-success-soft text-success",
  RESET: "bg-muted text-muted-foreground",
};

const refundStageStyles: Record<string, string> = {
  complete: "border-success/30 bg-success-soft/60 text-success",
  current: "border-warning/30 bg-warning-soft/60 text-warning-foreground",
  upcoming: "border-border bg-muted/40 text-muted-foreground",
  failed: "border-destructive/30 bg-destructive-soft/40 text-destructive",
};

const paymentStatusIcon = (status: string) => {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle2 className="h-4 w-4" />;
    case "FAILED":
      return <XCircle className="h-4 w-4" />;
    case "RESET":
      return <RotateCcw className="h-4 w-4" />;
    default:
      return <Clock3 className="h-4 w-4" />;
  }
};

const refundStageIcon = (state: string) => {
  switch (state) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4" />;
    case "failed":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock3 className="h-4 w-4" />;
  }
};

export function PaymentAuditLog({ audit, isCreator }: PaymentAuditLogProps) {
  const attempts = audit?.attempts || [];
  const refundTracking = audit?.refundTracking;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Payment History
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Refund: {humanize(audit?.refundStatus || "NOT_REQUESTED")} · Retries: {audit?.retryCount || 0}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Current status: <span className="font-bold text-foreground">{humanize(audit?.status)}</span>
        </div>
      </div>

      {refundTracking && (
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Refund Tracker</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {refundTracking.status === "PROCESSED"
                  ? `Completed on ${formatDate(refundTracking.completedAt)}`
                  : `Expected arrival: ${formatDate(refundTracking.expectedArrivalDate)}`}
              </div>
            </div>
            {(refundTracking.expectedArrivalDate || refundTracking.completedAt) && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {refundTracking.status === "PROCESSED" ? "Arrival confirmed" : "Arrival ETA available"}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(refundTracking.stages || []).map((stage) => (
              <div
                key={stage.key}
                className={`rounded-xl border px-4 py-3 ${refundStageStyles[stage.state] || refundStageStyles.upcoming}`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {refundStageIcon(stage.state)}
                  {stage.label}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  {stage.date ? formatDate(stage.date) : "Waiting for update"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Attempt</th>
              <th className="px-5 py-3 text-left font-semibold">Date/time</th>
              <th className="px-5 py-3 text-left font-semibold">Method</th>
              <th className="px-5 py-3 text-left font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Amount</th>
              {isCreator && <th className="px-5 py-3 text-left font-semibold">Reference</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={isCreator ? 6 : 5} className="px-5 py-8 text-center text-muted-foreground">
                  No payment attempts recorded yet.
                </td>
              </tr>
            ) : (
              attempts.map((attempt) => (
                <tr key={attempt.id || `${attempt.attemptNumber}-${attempt.status}`} className="transition-colors hover:bg-accent/30">
                  <td className="px-5 py-3 font-semibold">#{attempt.attemptNumber}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{formatDate(attempt.attemptedAt)}</td>
                  <td className="px-5 py-3">{humanize(attempt.method || attempt.gateway)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[attempt.status] || "bg-muted text-muted-foreground"}`}>
                        {paymentStatusIcon(attempt.status)}
                        {humanize(attempt.status)}
                      </span>
                      {(attempt.failureReason || attempt.failureCode) && (
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium text-foreground/90">
                            {attempt.failureExplanation?.title || attempt.failureReason || "Failed"}
                          </div>
                          <div>
                            {attempt.failureExplanation?.detail || attempt.failureReason || "Payment could not be completed"}
                            {attempt.failureCode ? ` (${attempt.failureCode})` : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(attempt.amount)}</td>
                  {isCreator && (
                    <td className="max-w-56 truncate px-5 py-3 text-xs text-muted-foreground">
                      {attempt.gatewayPaymentId || attempt.source || "Not recorded"}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreator && (audit?.refundReference || audit?.refundReason) && (
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Refund reference: {audit.refundReference || "Not recorded"}
          {audit.refundReason ? ` · ${audit.refundReason}` : ""}
        </div>
      )}
    </section>
  );
}
