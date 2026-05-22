import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth";
import { Panel } from "@/components/settings/SettingsComponents";
import { Check, X, ShieldCheck, Loader2 } from "lucide-react";

export function BillingSection() {
  const { user, toggleSubscription, isLoading } = useAuth();
  const currentPlan = user?.plan || "FREE";

  const handleTogglePlan = async () => {
    try {
      await toggleSubscription();
    } catch {
      // errors already toasted in toggleSubscription
    }
  };

  const freeFeatures = [
    "10 invoices / month",
    "Basic email reminders",
    "Standard dashboard overview",
  ];

  const premiumFeatures = [
    "Unlimited invoices / month",
    "Advanced cashflow analytics & metrics",
    "Client payment risk scoring",
    "Custom branded invoice themes & signatures",
    "Automated follow-up workflows",
    "Dynamic cashflow payment insights",
    "Dedicated Client portal history",
    "Advanced data exports (CSV)",
  ];

  return (
    <Panel title="Subscription & billing" description="Manage your plan, limits, and unlock premium features.">
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        {/* Free Plan Card */}
        <div className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all bg-card ${
          currentPlan === "FREE" ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "border-border shadow-xs"
        }`}>
          {currentPlan === "FREE" && (
            <span className="absolute -top-3 right-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-soft rounded-full border border-primary/20 shadow-xs">
              Current Plan
            </span>
          )}
          <div>
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Free Plan</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">₹0</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Perfect for getting started and managing a small client base.
            </p>
            <div className="h-px bg-border/50 my-5" />
            <ul className="space-y-2.5 text-xs text-foreground font-medium">
              {freeFeatures.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
              {premiumFeatures.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-muted-foreground/60 line-through">
                  <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <Button
              variant={currentPlan === "FREE" ? "outline" : "secondary"}
              disabled={currentPlan === "FREE" || isLoading}
              onClick={handleTogglePlan}
              className="w-full rounded-xl font-bold h-11 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : currentPlan === "FREE" ? (
                "Free Plan Active"
              ) : (
                "Downgrade to Free"
              )}
            </Button>
          </div>
        </div>

        {/* Paid Plan Card */}
        <div className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all bg-card overflow-hidden ${
          currentPlan === "PAID" ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "border-border shadow-xs"
        }`}>
          {currentPlan === "PAID" ? (
            <span className="absolute -top-3 right-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-soft rounded-full border border-primary/20 shadow-xs">
              Current Plan
            </span>
          ) : (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-8 py-1.5 rotate-45 translate-x-6 translate-y-3">
              Popular
            </div>
          )}
          
          <div>
            <div className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Growth Plan (Paid)
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">₹999</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              For professional freelancers and growing businesses needing complete analytics, automations, and custom themes.
            </p>
            <div className="h-px bg-border/50 my-5" />
            <ul className="space-y-2.5 text-xs text-foreground font-medium">
              {premiumFeatures.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <Button
              variant={currentPlan === "PAID" ? "outline" : "default"}
              disabled={isLoading}
              onClick={handleTogglePlan}
              className={`w-full rounded-xl font-bold h-11 transition-all ${
                currentPlan !== "PAID" ? "gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] hover:shadow-pop" : ""
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : currentPlan === "PAID" ? (
                "Growth Plan Active"
              ) : (
                "Upgrade to Paid"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
