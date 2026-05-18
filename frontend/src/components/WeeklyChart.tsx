import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { inrShort, formatINR } from "@/lib/mock";

interface WeeklyChartProps {
  data: any[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-card animate-fade-up" style={{ animationDelay: "320ms" }}>
      <h2 className="text-base font-semibold">This week</h2>
      <p className="text-xs text-muted-foreground mb-4">Daily collections</p>
      <div className="h-48 w-full min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.92 0.012 255)" vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.554 0.046 257)" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="oklch(0.554 0.046 257)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={inrShort} />
            <Tooltip
              cursor={{ fill: "oklch(0.95 0.04 262 / 0.4)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid oklch(0.92 0.012 255)",
                fontSize: 12,
              }}
              formatter={(v) => formatINR(Number(v))}
            />
            <Bar dataKey="paid" fill="oklch(0.546 0.215 262.881)" radius={[6, 6, 0, 0]} animationDuration={900} />
            <Bar dataKey="pending" fill="oklch(0.78 0.16 75)" radius={[6, 6, 0, 0]} animationDuration={1100} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
