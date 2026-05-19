import { RiskFilterType } from "@/hooks/useClientRisk";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface ClientFilterTabsProps {
  filter: RiskFilterType;
  onChange: (filter: RiskFilterType) => void;
  counts: {
    all: number;
    red: number;
    yellow: number;
    green: number;
  };
}

export function ClientFilterTabs({ filter, onChange, counts }: ClientFilterTabsProps) {
  return (
    <div className="flex gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-card h-fit overflow-x-auto scrollbar-none">
      <button
        onClick={() => onChange("ALL")}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
          filter === "ALL" 
            ? "bg-primary text-primary-foreground shadow-glow" 
            : "text-muted-foreground hover:bg-accent"
        }`}
      >
        All ({counts.all})
      </button>
      <button
        onClick={() => onChange("RED")}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
          filter === "RED" 
            ? "bg-destructive text-destructive-foreground" 
            : "text-destructive hover:bg-destructive-soft"
        }`}
      >
        <ShieldAlert className="h-3 w-3" />
        High Risk ({counts.red})
      </button>
      <button
        onClick={() => onChange("YELLOW")}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
          filter === "YELLOW" 
            ? "bg-warning text-warning-foreground" 
            : "text-warning hover:bg-warning-soft"
        }`}
      >
        <AlertTriangle className="h-3 w-3" />
        Moderate ({counts.yellow})
      </button>
      <button
        onClick={() => onChange("GREEN")}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
          filter === "GREEN" 
            ? "bg-success text-success-foreground" 
            : "text-success hover:bg-success-soft"
        }`}
      >
        <CheckCircle2 className="h-3 w-3" />
        Reliable ({counts.green})
      </button>
    </div>
  );
}
