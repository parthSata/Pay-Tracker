import { ArrowUpRight } from "lucide-react";
import { CountUp } from "@/components/shared/CountUp";
import { formatINR } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  tone?: "primary" | "warning" | "destructive";
  color?: string; // For gradient or custom classes
  desc?: string;
  isCurrency?: boolean;
  delay?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone,
  color,
  desc,
  isCurrency = true,
  delay = 0,
}: StatCardProps) {
  const toneStyles = tone
    ? {
        primary: "bg-primary-soft text-primary",
        warning: "bg-warning-soft text-warning-foreground",
        destructive: "bg-destructive-soft text-destructive",
      }[tone]
    : "";

  return (
    <div
      className="group relative rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all duration-300 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            <CountUp to={value} format={isCurrency ? (n) => formatINR(Math.round(n)) : undefined} />
          </div>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color ? `bg-linear-to-br ${color} text-white shadow-lg` : toneStyles}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(trend || desc) && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && (
            <span className="inline-flex items-center gap-1 font-medium text-success">
              <ArrowUpRight className="h-3 w-3" />
              {trend}
            </span>
          )}
          {desc || "vs last month"}
        </div>
      )}
    </div>
  );
}
