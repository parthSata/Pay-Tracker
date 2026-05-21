import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyCashPosition } from "@/hooks/useDailyCashPosition";
import { CashPositionHeader } from "@/components/dashboard/CashPositionHeader";
import { CashPositionMetricCard } from "@/components/dashboard/CashPositionMetricCard";
import { CashPositionInvoiceItem } from "@/components/dashboard/CashPositionInvoiceItem";

interface DailyCashPositionProps {
  invoices: any[];
  receivedInvoices?: any[];
}

export function DailyCashPosition({ invoices, receivedInvoices = [] }: DailyCashPositionProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"receivables" | "payables">(() => {
    if (invoices.length === 0 && receivedInvoices.length > 0) {
      return "payables";
    }
    return "receivables";
  });

  const currentInvoices = mode === "receivables" ? invoices : receivedInvoices;

  const {
    activeTab,
    setActiveTab,
    expectedTodayInvoices,
    overdueInvoices,
    incomingWeekInvoices,
    totalExpectedToday,
    totalOverdue,
    totalIncomingWeek,
    insightText,
    insightTone,
    activeInvoices,
    sendingStates,
    getDaysOverdue,
    getDaysUntilDue,
    getInvoiceTotal,
    sendReminder,
  } = useDailyCashPosition(currentInvoices);

  // Customize insight message for Payables mode
  const displayInsightText = mode === "payables"
    ? overdueInvoices.length > 0
      ? `You have ${overdueInvoices.length} overdue payment(s) to settle. Please check your payables.`
      : expectedTodayInvoices.length > 0
      ? "You have payments due today. Settle them on time to maintain credit score."
      : "You are all caught up on your payments! Great job."
    : insightText;

  const displayInsightTone = mode === "payables"
    ? overdueInvoices.length > 0
      ? "warning"
      : "success"
    : insightTone;

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-card overflow-hidden animate-fade-up">
      {/* Header Banner with mode toggle */}
      <CashPositionHeader
        insightText={displayInsightText}
        insightTone={displayInsightTone}
        mode={mode}
        setMode={setMode}
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
        <CashPositionMetricCard
          tabId="today"
          activeTab={activeTab}
          onClick={() => setActiveTab("today")}
          label={mode === "payables" ? "DUE TODAY" : t("dashboard_expected_today")}
          amount={totalExpectedToday}
          invoiceCount={expectedTodayInvoices.length}
          iconType="calendar"
        />

        <CashPositionMetricCard
          tabId="overdue"
          activeTab={activeTab}
          onClick={() => setActiveTab("overdue")}
          label={mode === "payables" ? "OVERDUE" : t("dashboard_overdue")}
          amount={totalOverdue}
          invoiceCount={overdueInvoices.length}
          iconType="warning"
        />

        <CashPositionMetricCard
          tabId="week"
          activeTab={activeTab}
          onClick={() => setActiveTab("week")}
          label={mode === "payables" ? "DUE THIS WEEK" : t("dashboard_incoming_this_week")}
          amount={totalIncomingWeek}
          invoiceCount={incomingWeekInvoices.length}
          iconType="clock"
        />
      </div>

      {/* Drawer / Expandable List of Matching Invoices */}
      <div className="p-5 bg-card/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {activeInvoices.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-7 w-7 text-success shrink-0" />
                <span>
                  {mode === "payables"
                    ? activeTab === "today"
                      ? "All clear! No payments due today."
                      : activeTab === "overdue"
                      ? "No overdue payments."
                      : "No payments due this week."
                    : activeTab === "today"
                    ? t("dashboard_all_clear_today")
                    : activeTab === "overdue"
                    ? t("dashboard_no_overdue")
                    : t("dashboard_no_incoming_week")}
                </span>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-72 overflow-y-auto scrollbar-none pr-1 space-y-2">
                {activeInvoices.map((inv) => (
                  <CashPositionInvoiceItem
                    key={inv._id}
                    invoice={inv}
                    activeTab={activeTab}
                    sendingState={sendingStates[inv._id] || "idle"}
                    daysOverdue={getDaysOverdue(inv.dueDate)}
                    daysUntil={getDaysUntilDue(inv.dueDate)}
                    invoiceTotal={getInvoiceTotal(inv)}
                    sendReminder={() => sendReminder(inv._id)}
                    mode={mode}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
