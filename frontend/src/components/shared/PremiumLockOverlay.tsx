import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

interface PremiumLockOverlayProps {
  title: string;
  description: string;
  tabId?: string;
}

export function PremiumLockOverlay({ title, description, tabId = "billing" }: PremiumLockOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md bg-background/45 border border-border/20 rounded-2xl animate-fade-in select-none">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
        <Lock className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-bold tracking-tight text-foreground">{title}</h4>
      <p className="mt-1.5 text-xs text-muted-foreground max-w-[220px] leading-relaxed">
        {description}
      </p>
      <Link
        to="/settings"
        search={{ tab: tabId }}
        className="mt-3.5 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-glow hover:scale-105 transition-all"
      >
        Upgrade to Paid
      </Link>
    </div>
  );
}
