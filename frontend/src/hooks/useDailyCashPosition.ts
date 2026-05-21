import { useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type TabType = "today" | "overdue" | "week";

const getLocalMidnight = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export function useDailyCashPosition(invoices: any[]) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [sendingStates, setSendingStates] = useState<Record<string, "idle" | "sending" | "success">>({});

  const now = useMemo(() => new Date(), []);

  const todayStart = useMemo(() => {
    return getLocalMidnight(now);
  }, [now]);

  const sevenDaysLater = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() + 7);
    return d;
  }, [todayStart]);

  const getInvoiceTotal = (inv: any) => {
    return inv.totalAmount || (inv.amount + (inv.gstAmount || 0));
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

  // Filter lists memoized
  const expectedTodayInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status === "PAID") return false;
      const dueMidnight = getLocalMidnight(inv.dueDate);
      return dueMidnight.getTime() === todayStart.getTime();
    });
  }, [invoices, todayStart]);

  const overdueInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status === "PAID") return false;
      const dueMidnight = getLocalMidnight(inv.dueDate);
      return dueMidnight.getTime() < todayStart.getTime();
    });
  }, [invoices, todayStart]);

  const incomingWeekInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status === "PAID") return false;
      const dueMidnight = getLocalMidnight(inv.dueDate);
      return dueMidnight.getTime() > todayStart.getTime() && dueMidnight.getTime() <= sevenDaysLater.getTime();
    });
  }, [invoices, todayStart, sevenDaysLater]);

  // Calculate sums memoized
  const totalExpectedToday = useMemo(() => {
    return expectedTodayInvoices.reduce((acc, curr) => acc + getInvoiceTotal(curr), 0);
  }, [expectedTodayInvoices]);

  const totalOverdue = useMemo(() => {
    return overdueInvoices.reduce((acc, curr) => acc + getInvoiceTotal(curr), 0);
  }, [overdueInvoices]);

  const totalIncomingWeek = useMemo(() => {
    return incomingWeekInvoices.reduce((acc, curr) => acc + getInvoiceTotal(curr), 0);
  }, [incomingWeekInvoices]);

  // Generate dynamic psychological quote / dashboard message
  const { insightText, insightTone } = useMemo(() => {
    let text = t("dashboard_cash_insight_healthy");
    let tone: "info" | "warning" | "success" = "success";

    if (totalOverdue > 0) {
      text = t("dashboard_cash_insight_action");
      tone = "warning";
    } else if (totalExpectedToday > 0) {
      text = t("dashboard_cash_insight_pending");
      tone = "info";
    }

    return { insightText: text, insightTone: tone };
  }, [totalOverdue, totalExpectedToday, t]);

  // Trigger manual reminder
  const sendReminder = async (invoiceId: string) => {
    const token = localStorage.getItem("pay_tracker_token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setSendingStates((prev) => ({ ...prev, [invoiceId]: "sending" }));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/invoices/${invoiceId}/remind`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Reminder sent successfully!");
      setSendingStates((prev) => ({ ...prev, [invoiceId]: "success" }));
      setTimeout(() => {
        setSendingStates((prev) => ({ ...prev, [invoiceId]: "idle" }));
      }, 3000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to send reminder";
      toast.error(errMsg);
      setSendingStates((prev) => ({ ...prev, [invoiceId]: "idle" }));
    }
  };

  const activeInvoices = useMemo(() => {
    switch (activeTab) {
      case "today":
        return expectedTodayInvoices;
      case "overdue":
        return overdueInvoices;
      case "week":
        return incomingWeekInvoices;
      default:
        return [];
    }
  }, [activeTab, expectedTodayInvoices, overdueInvoices, incomingWeekInvoices]);

  return {
    activeTab,
    setActiveTab,
    sendingStates,
    expectedTodayInvoices,
    overdueInvoices,
    incomingWeekInvoices,
    totalExpectedToday,
    totalOverdue,
    totalIncomingWeek,
    insightText,
    insightTone,
    activeInvoices,
    getDaysOverdue,
    getDaysUntilDue,
    getInvoiceTotal,
    sendReminder,
  };
}
