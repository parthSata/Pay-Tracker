import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Lock,
  Palette,
  Globe,
  CreditCard,
  Trash2,
  Shield,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { RegionalSection } from "@/components/settings/RegionalSection";
import { BillingSection } from "@/components/settings/BillingSection";
import { GstSettingsSection } from "@/components/settings/GstSettingsSection";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Pay Tracker" },
      { name: "description", content: "Configure notifications, security, billing and appearance preferences." },
    ],
  }),
  component: SettingsPage,
});

const sections = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "regional", label: "Regional", icon: Globe },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "gst", label: "GST Settings", icon: Shield },
  { id: "danger", label: "Delete Account", icon: Trash2 },
];

function SettingsPage() {
  const [active, setActive] = useState("notifications");

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto animate-fade-up">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspace, security & preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          {/* Side nav */}
          <aside className="rounded-2xl border border-border bg-card p-2 shadow-card h-fit sticky top-20">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              const danger = s.id === "danger";
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? danger
                        ? "bg-destructive-soft text-destructive"
                        : "bg-primary text-primary-foreground shadow-glow"
                      : danger
                        ? "text-destructive hover:bg-destructive-soft"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{s.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Panel */}
          <div className="space-y-4 animate-fade-in">
            {active === "notifications" && <NotificationsSection />}
            {active === "security" && <SecuritySection />}
            {active === "appearance" && <AppearanceSection />}
            {active === "regional" && <RegionalSection />}
            {active === "billing" && <BillingSection />}
            {active === "gst" && <GstSettingsSection />}
            {active === "danger" && <DeleteAccountSection />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}


