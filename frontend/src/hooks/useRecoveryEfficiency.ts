import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatINR } from "@/lib/utils";

export interface UseRecoveryEfficiencyProps {
  invoices: any[];
}

export function useRecoveryEfficiency({ invoices }: UseRecoveryEfficiencyProps) {
  const { t } = useTranslation();

  const monthlyData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString("en-IN", { month: "short" });
      const yearSuffix = d.getFullYear().toString().substring(2);
      const monthYearLabel = `${monthName} '${yearSuffix}`;

      const monthInvoices = invoices.filter((inv) => {
        const invDate = new Date(inv.createdAt);
        return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
      });

      const monthInvoiced = monthInvoices.reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);
      const monthPaid = monthInvoices
        .filter((inv) => inv.status === "PAID")
        .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);

      const efficiency = monthInvoiced > 0 ? Math.round((monthPaid / monthInvoiced) * 100) : 100;

      result.push({
        label: monthYearLabel,
        efficiency,
        invoiced: monthInvoiced,
        paid: monthPaid,
      });
    }

    return result;
  }, [invoices]);

  return {
    monthlyData,
    formatINR,
    t,
  };
}
