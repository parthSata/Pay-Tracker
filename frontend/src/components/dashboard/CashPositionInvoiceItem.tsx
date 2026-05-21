import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle2, Send, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CashPositionInvoiceItemProps {
  invoice: any;
  activeTab: "today" | "overdue" | "week";
  sendingState: "idle" | "sending" | "success";
  daysOverdue: number;
  daysUntil: number;
  invoiceTotal: number;
  sendReminder: () => void;
  mode?: "receivables" | "payables";
}

export function CashPositionInvoiceItem({
  invoice,
  activeTab,
  sendingState,
  daysOverdue,
  daysUntil,
  invoiceTotal,
  sendReminder,
  mode = "receivables",
}: CashPositionInvoiceItemProps) {
  const { t } = useTranslation();

  const isReminderSentToday = () => {
    if (!invoice.lastReminderSentAt) return false;
    const lastSent = new Date(invoice.lastReminderSentAt);
    const today = new Date();
    return (
      lastSent.getFullYear() === today.getFullYear() &&
      lastSent.getMonth() === today.getMonth() &&
      lastSent.getDate() === today.getDate()
    );
  };

  const alreadySentToday = isReminderSentToday();

  const displayName = mode === "payables"
    ? (invoice.userId?.businessName || invoice.userId?.name || "Merchant")
    : invoice.clientName;

  return (
    <div className="flex items-center justify-between py-3.5 hover:bg-accent/30 rounded-xl px-3 transition-all group animate-fade-in">
      {/* Left: Info details */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center text-xs font-semibold shrink-0">
          {displayName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate text-foreground">
            {displayName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-sm">
              {invoice.invoiceNumber}
            </span>
            <span>•</span>
            <span
              className={`font-medium ${
                activeTab === "overdue"
                  ? "text-destructive"
                  : activeTab === "today"
                  ? "text-primary"
                  : "text-warning-foreground"
              }`}
            >
              {activeTab === "overdue"
                ? t("dashboard_days_overdue", { count: daysOverdue })
                : activeTab === "today"
                ? t("dashboard_due_today")
                : daysUntil === 1
                ? t("dashboard_due_tomorrow")
                : t("dashboard_due_in_days", { count: daysUntil })}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {formatINR(invoiceTotal)}
        </span>

        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Send Reminder Action Button (Only in receivables/sent mode) */}
          {mode !== "payables" && (
            <button
              onClick={sendReminder}
              disabled={sendingState === "sending" || sendingState === "success" || alreadySentToday}
              title={alreadySentToday ? t("dashboard_reminder_already_sent") || "Reminder already sent today" : t("dashboard_send_reminder")}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                alreadySentToday
                  ? "bg-success-soft text-success opacity-80 cursor-not-allowed"
                  : sendingState === "success"
                  ? "bg-success text-success-foreground"
                  : "bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
              }`}
            >
              {sendingState === "sending" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : sendingState === "success" || alreadySentToday ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* View Invoice / Pay */}
          <Link
            to="/pay/$id"
            params={{ id: invoice._id }}
            title={mode === "payables" ? "Pay Now" : t("dashboard_view_invoice")}
            className="h-8 w-8 rounded-lg bg-muted text-muted-foreground hover:bg-foreground hover:text-background flex items-center justify-center transition-all animate-fade-in"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
