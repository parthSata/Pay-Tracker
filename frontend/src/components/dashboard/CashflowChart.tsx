import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { inrShort, formatINR } from "@/lib/utils";

interface CashflowChartProps {
  data: any[];
}

export function CashflowChart({ data }: CashflowChartProps) {
  return (
    <div className="lg:col-span-2 min-w-0 rounded-2xl bg-card border border-border p-5 shadow-card animate-fade-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Cashflow</h2>
          <p className="text-xs text-muted-foreground">Daily revenue — last 30 days</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Revenue</span>
        </div>
      </div>
      <div className="h-72 w-full min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.546 0.215 262.881)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.546 0.215 262.881)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.92 0.012 255)" vertical={false} />
            <XAxis dataKey="date" stroke="oklch(0.554 0.046 257)" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="oklch(0.554 0.046 257)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={inrShort} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid oklch(0.92 0.012 255)",
                boxShadow: "0 8px 24px oklch(0.129 0.042 264.695 / 0.08)",
                fontSize: 12,
              }}
              formatter={(v) => formatINR(Number(v))}
            />
            <Area type="monotone" dataKey="amount" stroke="oklch(0.546 0.215 262.881)" strokeWidth={2.5} fill="url(#rev)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
