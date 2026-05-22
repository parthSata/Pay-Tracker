import { Sparkles, HelpCircle } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CountUp } from "@/components/shared/CountUp";
import { useRecoveryRateGauge } from "@/hooks/useRecoveryRateGauge";
import { useAuth } from "@/auth";
import { PremiumLockOverlay } from "@/components/shared/PremiumLockOverlay";

interface RecoveryRateGaugeProps {
  invoices: any[];
  className?: string;
}

export function RecoveryRateGauge({ invoices, className = "" }: RecoveryRateGaugeProps) {
  const { user } = useAuth();
  const isFree = user?.plan === "FREE";
  const {
    recoveryRate,
    insight,
    radius,
    strokeWidth,
    circumference,
    strokeDashoffset,
    t,
  } = useRecoveryRateGauge({ invoices });

  return (
    <div 
      className={`relative rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-pop transition-all duration-300 animate-fade-up flex flex-col justify-between ${className}`}
      style={{ animationDelay: "150ms" }}
    >
      <div className={`flex flex-col justify-between h-full ${isFree ? "filter blur-sm select-none pointer-events-none" : ""}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard_recovery_rate", "Recovery Rate")}
          </h3>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Overall paid vs invoiced amount</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col items-center justify-center py-4 relative">
          <div className="relative h-32 w-32 flex items-center justify-center">
            <svg className="absolute transform -rotate-90 w-full h-full">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-muted"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="oklch(0.546 0.215 262.881)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-3xl font-bold tracking-tight">
                <CountUp to={recoveryRate} format={(n) => `${Math.round(n)}%`} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed ${insight.tone} transition-all`}>
        <div className="font-bold flex items-center gap-1 mb-0.5">
          <Sparkles className="h-3 w-3 inline" />
          {insight.heading}
        </div>
        {insight.text}
      </div>
      </div>
      {isFree && (
        <PremiumLockOverlay
          title="Recovery Rate Analytics"
          description="Unlock deep analytics on collection performance and collection efficiency."
        />
      )}
    </div>
  );
}
