import { Sparkles } from "lucide-react";
import { CountUp } from "@/components/shared/CountUp";
import { formatINR } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ExpectedRevenueProps {
  pending: number;
  pendingInvoicesCount: number;
}

export function ExpectedRevenue({ pending, pendingInvoicesCount }: ExpectedRevenueProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl gradient-primary text-primary-foreground p-6 shadow-glow relative overflow-hidden animate-fade-up" style={{ animationDelay: "260ms" }}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-4 h-20 w-20 rounded-full bg-white/5" />
      <Sparkles className="h-5 w-5 mb-3" />
      <div className="text-xs uppercase tracking-wider opacity-80">{t('dashboard_expected_next_30_days')}</div>
      <div className="text-4xl font-semibold mt-2 tracking-tight">
        <CountUp to={pending} format={(n) => formatINR(Math.round(n))} />
      </div>
      <p className="text-sm opacity-80 mt-2 leading-relaxed">
        {t('dashboard_based_on_count_pending', { count: pendingInvoicesCount })}
      </p>
      <div className="mt-5 h-2 rounded-full bg-white/15 overflow-hidden">
        <div className="h-full bg-white rounded-full animate-fade-up" style={{ width: "100%", animationDelay: "600ms" }} />
      </div>
    </div>
  );
}
