import { Activity } from "lucide-react";
import { CountUp } from "@/components/shared/CountUp";
import { useCollectedVsPending } from "@/hooks/useCollectedVsPending";
import { useAuth } from "@/auth";
import { PremiumLockOverlay } from "@/components/shared/PremiumLockOverlay";

interface CollectedVsPendingProps {
  invoices: any[];
  className?: string;
}

export function CollectedVsPending({ invoices, className = "" }: CollectedVsPendingProps) {
  const { user } = useAuth();
  const isFree = user?.plan === "FREE";
  const {
    collected,
    pending,
    totalInvoiced,
    collectedPercent,
    pendingPercent,
    formatINR,
    t,
  } = useCollectedVsPending({ invoices });

  return (
    <div 
      className={`relative rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-pop transition-all duration-300 animate-fade-up flex flex-col justify-between ${className}`}
      style={{ animationDelay: "200ms" }}
    >
      <div className={`flex flex-col justify-between h-full ${isFree ? "filter blur-sm select-none pointer-events-none" : ""}`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard_collected_vs_pending", "Collected vs Pending")}
          </h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("dashboard_collected_amount", "Collected")}
              </span>
              <span className="text-sm font-semibold text-success">
                {collectedPercent}%
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground mb-1.5">
              <CountUp to={collected} format={formatINR} />
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${collectedPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("dashboard_pending_amount_label", "Pending / Overdue")}
              </span>
              <span className="text-sm font-semibold text-warning">
                {pendingPercent}%
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground mb-1.5">
              <CountUp to={pending} format={formatINR} />
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-warning rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${pendingPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
        <span>{t("dashboard_total_billed", "Total Invoiced")}</span>
        <span className="font-semibold text-foreground">{formatINR(totalInvoiced)}</span>
      </div>
      </div>
      {isFree && (
        <PremiumLockOverlay
          title="Collected vs Pending Analytics"
          description="Track payments received compared to pending invoices in real-time."
        />
      )}
    </div>
  );
}
