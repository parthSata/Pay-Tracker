import { useState, useMemo } from "react";
import { useDailyCashPosition } from "@/hooks/useDailyCashPosition";

interface UseDailyCashPositionControllerProps {
  invoices: any[];
  receivedInvoices?: any[];
}

export function useDailyCashPositionController({
  invoices,
  receivedInvoices = [],
}: UseDailyCashPositionControllerProps) {
  const [mode, setMode] = useState<"receivables" | "payables">(() => {
    if (invoices.length === 0 && receivedInvoices.length > 0) {
      return "payables";
    }
    return "receivables";
  });

  const currentInvoices = mode === "receivables" ? invoices : receivedInvoices;

  const dailyCashData = useDailyCashPosition(currentInvoices);

  // Customize insight message for Payables mode
  const displayInsightText = useMemo(() => {
    if (mode === "payables") {
      return dailyCashData.overdueInvoices.length > 0
        ? `You have ${dailyCashData.overdueInvoices.length} overdue payment(s) to settle. Please check your payables.`
        : dailyCashData.expectedTodayInvoices.length > 0
        ? "You have payments due today. Settle them on time to maintain credit score."
        : "You are all caught up on your payments! Great job.";
    }
    return dailyCashData.insightText;
  }, [mode, dailyCashData.overdueInvoices.length, dailyCashData.expectedTodayInvoices.length, dailyCashData.insightText]);

  const displayInsightTone = useMemo(() => {
    if (mode === "payables") {
      return dailyCashData.overdueInvoices.length > 0 ? "warning" : "success";
    }
    return dailyCashData.insightTone;
  }, [mode, dailyCashData.overdueInvoices.length, dailyCashData.insightTone]);

  return {
    ...dailyCashData,
    mode,
    setMode,
    displayInsightText,
    displayInsightTone,
  };
}
