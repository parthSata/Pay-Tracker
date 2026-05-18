import { TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "./StatCard";

interface DashboardSummaryProps {
  totalRevenue: number;
  pending: number;
  overdue: number;
}

export function DashboardSummary({ totalRevenue, pending, overdue }: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Total Revenue" value={totalRevenue} icon={TrendingUp} trend="+0%" tone="primary" delay={0} />
      <StatCard label="Pending Amount" value={pending} icon={Clock} trend="+0%" tone="warning" delay={80} />
      <StatCard label="Overdue Amount" value={overdue} icon={AlertTriangle} trend="-0%" tone="destructive" delay={160} />
    </div>
  );
}
