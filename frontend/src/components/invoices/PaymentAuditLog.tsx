import { CheckCircle2, Clock3, RotateCcw, ShieldCheck, XCircle } from "lucide-react";

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
  source?: string;
}

interface PaymentAudit {
  status?: string;
  method?: string;
  paidAt?: string;
  retryCount?: number;
  refundStatus?: string;
  refundUpdatedAt?: string;
  refundReference?: string;
  refundReason?: string;
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

const statusIcon = (status: string) => {
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

export function PaymentAuditLog({ audit, isCreator }: PaymentAuditLogProps) {
  const attempts = audit?.attempts || [];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Payment History
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Refund: {humanize(audit?.refundStatus || "NOT_REQUESTED")} · Retries: {audit?.retryCount || 0}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Current status: <span className="font-bold text-foreground">{humanize(audit?.status)}</span>
        </div>
      </div>

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
                <tr key={attempt.id || `${attempt.attemptNumber}-${attempt.status}`} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 font-semibold">#{attempt.attemptNumber}</td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{formatDate(attempt.attemptedAt)}</td>
                  <td className="px-5 py-3">{humanize(attempt.method || attempt.gateway)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[attempt.status] || "bg-muted text-muted-foreground"}`}>
                        {statusIcon(attempt.status)}
                        {humanize(attempt.status)}
                      </span>
                      {(attempt.failureReason || attempt.failureCode) && (
                        <span className="text-xs text-muted-foreground">
                          {attempt.failureReason || "Failed"}{attempt.failureCode ? ` (${attempt.failureCode})` : ""}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(attempt.amount)}</td>
                  {isCreator && (
                    <td className="px-5 py-3 text-xs text-muted-foreground max-w-56 truncate">
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
