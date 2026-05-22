import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatINR } from "@/lib/utils";

const getLocalMidnight = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const getDaysOverdue = (dateStr: string) => {
  const dueMidnight = getLocalMidnight(dateStr);
  const todayMidnight = getLocalMidnight(new Date());
  const diffTime = todayMidnight.getTime() - dueMidnight.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

const getDaysUntilDue = (dateStr: string) => {
  const dueMidnight = getLocalMidnight(dateStr);
  const todayMidnight = getLocalMidnight(new Date());
  const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

interface UseCashPositionInvoiceItemProps {
  invoice: any;
  activeTab: "today" | "overdue" | "week";
  mode?: "receivables" | "payables";
}

export function useCashPositionInvoiceItem({
  invoice,
  activeTab,
  mode = "receivables",
}: UseCashPositionInvoiceItemProps) {
  const { t } = useTranslation();

  const alreadySentToday = useMemo(() => {
    if (!invoice.lastReminderSentAt) return false;
    const lastSent = new Date(invoice.lastReminderSentAt);
    const today = new Date();
    return (
      lastSent.getFullYear() === today.getFullYear() &&
      lastSent.getMonth() === today.getMonth() &&
      lastSent.getDate() === today.getDate()
    );
  }, [invoice.lastReminderSentAt]);

  const displayName = useMemo(() => {
    return mode === "payables"
      ? invoice.userId?.businessName || invoice.userId?.name || "Merchant"
      : invoice.clientName;
  }, [invoice.userId, invoice.clientName, mode]);

  const invoiceTotal = useMemo(() => {
    return invoice.totalAmount || (invoice.amount + (invoice.gstAmount || 0));
  }, [invoice.totalAmount, invoice.amount, invoice.gstAmount]);

  const dueStatusText = useMemo(() => {
    if (activeTab === "overdue") {
      const days = getDaysOverdue(invoice.dueDate);
      return t("dashboard_days_overdue", { count: days });
    } else if (activeTab === "today") {
      return t("dashboard_due_today");
    } else {
      const days = getDaysUntilDue(invoice.dueDate);
      return days === 1
        ? t("dashboard_due_tomorrow")
        : t("dashboard_due_in_days", { count: days });
    }
  }, [activeTab, invoice.dueDate, t]);

  const formattedTotal = useMemo(() => {
    return formatINR(invoiceTotal);
  }, [invoiceTotal]);

  return {
    alreadySentToday,
    displayName,
    dueStatusText,
    formattedTotal,
    t,
  };
}
