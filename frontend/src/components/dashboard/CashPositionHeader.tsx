import { Sparkles, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CashPositionHeaderProps {
  insightText: string;
  insightTone: "info" | "warning" | "success";
  mode: "receivables" | "payables";
  setMode: (mode: "receivables" | "payables") => void;
}

export function CashPositionHeader({
  insightText,
  insightTone,
  mode,
  setMode,
}: CashPositionHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="p-5 border-b border-border bg-linear-to-r from-accent/5 via-transparent to-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse shrink-0" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {t("dashboard_daily_cash_position")}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "payables"
              ? "Track short-term payments you owe to other businesses."
              : t("dashboard_cash_position_desc")}
          </p>
        </div>

        {/* Segmented Control Mode Toggle */}
        <div className="flex items-center self-start sm:self-auto bg-muted/50 p-1 rounded-xl border border-border/80">
          <button
            onClick={() => setMode("receivables")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "receivables"
                ? "bg-card text-foreground shadow-xs border border-border/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Receivables
          </button>
          <button
            onClick={() => setMode("payables")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "payables"
                ? "bg-card text-foreground shadow-xs border border-border/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Payables
          </button>
        </div>
      </div>

      {/* Dynamic Cash Health Message */}
      <div
        className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs transition-all duration-300 ${
          insightTone === "warning"
            ? "bg-destructive-soft/30 border-destructive/20 text-destructive-foreground dark:text-red-300"
            : insightTone === "info"
            ? "bg-primary-soft/30 border-primary/20 text-primary"
            : "bg-success-soft/30 border-success/20 text-success-foreground dark:text-green-300"
        }`}
      >
        {insightTone === "warning" ? (
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        ) : (
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
        )}
        <span className="leading-relaxed font-medium">{insightText}</span>
      </div>
    </div>
  );
}
