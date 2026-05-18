import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Panel } from "@/components/settings/SettingsComponents";

export function BillingSection() {
  return (
    <Panel title="Subscription & billing" description="Manage your plan and payment method.">
      <div className="rounded-2xl gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Current plan</div>
            <div className="text-2xl font-bold mt-1">Growth</div>
            <div className="text-xs opacity-80 mt-1">₹999 / month · Renews on 15 May 2025</div>
          </div>
          <Button variant="secondary" onClick={() => toast("Opening billing portal…")}>
            Manage plan
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        {[
          { label: "Invoices used", value: "248 / 500" },
          { label: "Team seats", value: "3 / 5" },
          { label: "Next bill", value: "₹999" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border p-4 bg-card">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className="text-lg font-semibold mt-1">{s.value}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
