import { ClientAnalytics } from "@/hooks/useClientRisk";
import { 
  Clock, 
  Percent, 
  FileText, 
  TrendingUp 
} from "lucide-react";

interface ClientCardProps {
  client: ClientAnalytics;
}

export function ClientCard({ client }: ClientCardProps) {
  const unpaidPct = Math.round(client.unpaidRatio * 100);
  const latePct = Math.round(client.latePaymentFrequency * 100);

  return (
    <div 
      className="group bg-card border border-border rounded-3xl p-6 shadow-card hover:shadow-card-hover hover:border-accent/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors break-words">
              {client.clientName}
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {client.clientEmail}
            </p>
          </div>

          {/* Risk Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
            client.riskColor === "RED" 
              ? "bg-destructive-soft text-destructive border border-destructive/20" 
              : client.riskColor === "YELLOW" 
                ? "bg-warning-soft text-warning border border-warning/20" 
                : "bg-success-soft text-success border border-success/20"
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${
              client.riskColor === "RED" 
                ? "bg-destructive animate-pulse" 
                : client.riskColor === "YELLOW" 
                  ? "bg-warning" 
                  : "bg-success"
            }`} />
            {client.riskLevel}
          </span>
        </div>

        {/* Insights Bubble */}
        <div className={`p-3 rounded-2xl text-xs mb-6 font-medium flex items-center gap-2 ${
          client.riskColor === "RED" 
            ? "bg-destructive-soft/40 text-destructive" 
            : client.riskColor === "YELLOW" 
              ? "bg-warning-soft/40 text-warning" 
              : "bg-success-soft/40 text-success"
        }`}>
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span>{client.insight}</span>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/80">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Avg Delay
          </span>
          <p className="text-xl font-bold text-foreground">
            {client.averageDelayDays} <span className="text-xs font-normal text-muted-foreground">days</span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
            <Percent className="h-3 w-3" /> Late Freq
          </span>
          <p className="text-xl font-bold text-foreground">
            {latePct}%
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" /> Unpaid Ratio
          </span>
          <p className="text-xl font-bold text-foreground">
            {unpaidPct}%
          </p>
        </div>
      </div>
      
      {/* Visual Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
          <span>Unpaid Invoice Ratio</span>
          <span>{unpaidPct}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              client.riskColor === "RED" 
                ? "bg-destructive" 
                : client.riskColor === "YELLOW" 
                  ? "bg-warning" 
                  : "bg-success"
            }`}
            style={{ width: `${unpaidPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
