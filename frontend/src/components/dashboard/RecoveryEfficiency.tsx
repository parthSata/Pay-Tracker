import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { useRecoveryEfficiency } from "@/hooks/useRecoveryEfficiency";
import { useAuth } from "@/auth";
import { PremiumLockOverlay } from "@/components/shared/PremiumLockOverlay";

interface RecoveryEfficiencyProps {
  invoices: any[];
  className?: string;
}

export function RecoveryEfficiency({ invoices, className = "" }: RecoveryEfficiencyProps) {
  const { user } = useAuth();
  const isFree = user?.plan === "FREE";
  const { monthlyData, formatINR, t } = useRecoveryEfficiency({ invoices });

  return (
    <div 
      className={`relative rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-pop transition-all duration-300 animate-fade-up flex flex-col justify-between ${className}`}
      style={{ animationDelay: "250ms" }}
    >
      <div className={`flex flex-col justify-between h-full ${isFree ? "filter blur-sm select-none pointer-events-none" : ""}`}>
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dashboard_monthly_efficiency", "Recovery Efficiency")}
            </h3>
            <p className="text-xs text-muted-foreground">Paid % of invoices created per month</p>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="h-48 w-full min-h-0 min-w-0 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.92 0.012 255)" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="oklch(0.554 0.046 257)" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                stroke="oklch(0.554 0.046 257)" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.92 0.012 255)",
                  fontSize: 11,
                  backgroundColor: "var(--card)",
                  color: "var(--card-foreground)"
                }}
                formatter={(v, name) => {
                  if (name === "efficiency") return [`${v}%`, "Recovery Rate"];
                  return [formatINR(Number(v)), name === "paid" ? "Paid" : "Billed"];
                }}
              />
              <Bar 
                dataKey="efficiency" 
                radius={[5, 5, 0, 0]} 
                animationDuration={1000}
              >
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.efficiency >= 90 ? "oklch(0.72 0.18 150)" : "oklch(0.546 0.215 262.881)"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-center text-muted-foreground leading-snug">
        High recovery percentage indicates efficient client onboarding & payment terms.
      </div>
      </div>
      {isFree && (
        <PremiumLockOverlay
          title="Recovery Efficiency Analytics"
          description="Analyze collection rates for invoice cohorts and check month-over-month billing trends."
        />
      )}
    </div>
  );
}
