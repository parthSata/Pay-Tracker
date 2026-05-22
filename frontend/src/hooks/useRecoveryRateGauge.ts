import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface UseRecoveryRateGaugeProps {
  invoices: any[];
}

export function useRecoveryRateGauge({ invoices }: UseRecoveryRateGaugeProps) {
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

  const recoveryRate = useMemo(() => {
    return totalInvoiced > 0 ? (collected / totalInvoiced) * 100 : 0;
  }, [collected, totalInvoiced]);

  const getTherapeuticInsight = (rate: number) => {
    if (invoices.length === 0) {
      return {
        heading: "Blank Slate",
        text: "No invoices created yet. Your business exists in a state of pure, untaxed potential.",
        tone: "text-muted-foreground",
      };
    }
    if (rate >= 95) {
      return {
        heading: "Zen Mode",
        text: "Aesthetic bliss. Your cashflow is in perfect alignment. Corporate chakras fully activated.",
        tone: "text-success bg-success-soft/20 border-success/20",
      };
    } else if (rate >= 80) {
      return {
        heading: "Breathe In, Breathe Out",
        text: "Solid recovery. A few stubborn clients are holding up your enlightenment, but overall you are in a safe financial space.",
        tone: "text-primary bg-primary-soft/30 border-primary/20",
      };
    } else if (rate >= 50) {
      return {
        heading: "Suboptimal Vibes",
        text: "High tension. Some clients are mistaking your net-30 terms for a personal journey of self-discovery.",
        tone: "text-warning-foreground bg-warning-soft/30 border-warning/20",
      };
    } else {
      return {
        heading: "Deep Financial Panic",
        text: "Urgent therapy required. Your invoices are serving as interest-free loans for your clients' spiritual retreats.",
        tone: "text-destructive bg-destructive-soft/30 border-destructive/20",
      };
    }
  };

  const insight = useMemo(() => getTherapeuticInsight(recoveryRate), [recoveryRate, invoices.length]);

  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useMemo(() => {
    return circumference - (recoveryRate / 100) * circumference;
  }, [recoveryRate, circumference]);

  return {
    recoveryRate,
    insight,
    radius,
    strokeWidth,
    circumference,
    strokeDashoffset,
    t,
  };
}
