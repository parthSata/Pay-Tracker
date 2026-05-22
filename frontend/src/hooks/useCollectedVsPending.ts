import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatINR } from "@/lib/utils";

export interface UseCollectedVsPendingProps {
  invoices: any[];
}

export function useCollectedVsPending({ invoices }: UseCollectedVsPendingProps) {
  const { t } = useTranslation();

  const collected = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);
  }, [invoices]);

  const pending = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "PENDING" || inv.status === "OVERDUE")
      .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);
  }, [invoices]);

  const totalInvoiced = useMemo(() => collected + pending, [collected, pending]);

  const collectedPercent = useMemo(() => {
    return totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0;
  }, [collected, totalInvoiced]);

  const pendingPercent = useMemo(() => {
    return totalInvoiced > 0 ? Math.round((pending / totalInvoiced) * 100) : 0;
  }, [pending, totalInvoiced]);

  return {
    collected,
    pending,
    totalInvoiced,
    collectedPercent,
    pendingPercent,
    formatINR,
    t,
  };
}
