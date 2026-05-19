import { TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTranslation } from "react-i18next";

interface DashboardSummaryProps {
  totalRevenue: number;
  pending: number;
  overdue: number;
}

export function DashboardSummary({ totalRevenue, pending, overdue }: DashboardSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label={t('dashboard_total_revenue')} value={totalRevenue} icon={TrendingUp} trend="+0%" tone="primary" delay={0} />
      <StatCard label={t('dashboard_pending_amount')} value={pending} icon={Clock} trend="+0%" tone="warning" delay={80} />
      <StatCard label={t('dashboard_overdue_amount')} value={overdue} icon={AlertTriangle} trend="-0%" tone="destructive" delay={160} />
    </div>
  );
}
