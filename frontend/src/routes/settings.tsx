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
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "../context/NotificationContext";

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
            {active === "notifications" && <Notifications />}
            {active === "security" && <Security />}
            {active === "appearance" && <Appearance />}
            {active === "regional" && <Regional />}
            {active === "billing" && <Billing />}
            {active === "gst" && <GstSettings />}
            {active === "danger" && <DeleteAccountZone />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <Separator className="mb-5" />
      {children}
    </section>
  );
}

function Row({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Notifications() {
  const { settings, updateSettings } = useNotifications();

  return (
    <Panel
      title="Notifications"
      description="Decide how Pay Tracker keeps you in the loop on payments and reminders."
    >
      <div className="divide-y divide-border">
        <Row
          title="Payment received"
          description="Toast + email when a client pays an invoice."
          control={
            <Switch 
              checked={settings.paymentReceived} 
              onCheckedChange={(val) => updateSettings({ paymentReceived: val })} 
            />
          }
        />
        <Row
          title="Invoice viewed"
          description="Notify me when a client opens the payment page."
          control={
            <Switch 
              checked={settings.invoiceViewed} 
              onCheckedChange={(val) => updateSettings({ invoiceViewed: val })} 
            />
          }
        />
        <Row
          title="Overdue alerts"
          description="Daily digest of invoices past due date."
          control={
            <Switch 
              checked={settings.overdueAlerts} 
              onCheckedChange={(val) => updateSettings({ overdueAlerts: val })} 
            />
          }
        />
        <Row
          title="Weekly cashflow report"
          description="Summary every Monday at 9:00 AM IST."
          control={
            <Switch 
              checked={settings.cashflowReport} 
              onCheckedChange={(val) => updateSettings({ cashflowReport: val })} 
            />
          }
        />
        <Row
          title="Product updates"
          description="New features, tips and occasional offers."
          control={
            <Switch 
              checked={settings.productUpdates} 
              onCheckedChange={(val) => updateSettings({ productUpdates: val })} 
            />
          }
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={() => toast.success("Notification preferences saved")} className="gradient-primary text-primary-foreground shadow-glow">
          <Save className="h-4 w-4 mr-2" /> Save preferences
        </Button>
      </div>
    </Panel>
  );
}

function Security() {
  return (
    <>
      <Panel title="Password" description="Use a strong, unique password.">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">New</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => toast.success("Password updated")} className="gradient-primary text-primary-foreground">
            Update password
          </Button>
        </div>
      </Panel>

      <Panel title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <Row
          title="Authenticator app"
          description="Use TOTP codes from Google Authenticator, 1Password, etc."
          control={<Switch defaultChecked />}
        />
        <Row
          title="SMS backup"
          description="Receive a code on +91 98765 43210."
          control={<Switch />}
        />
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-success-soft text-success p-3 text-xs">
          <Shield className="h-4 w-4 shrink-0 mt-0.5" />
          <p>2FA is currently active. Last security check passed 2 hours ago.</p>
        </div>
      </Panel>
    </>
  );
}

import { useAppearanceSettings, useRegionalSettings, useGstSettings, useDeleteAccount } from "@/hooks/useSettings";

function Appearance() {
  const { theme, handleSetTheme } = useAppearanceSettings();

  return (
    <Panel title="Appearance" description="Customize the look of your dashboard.">
      <div className="grid sm:grid-cols-3 gap-3">
        {(["light", "dark", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleSetTheme(t)}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-pop ${
              theme === t ? "border-primary ring-2 ring-primary/30 bg-primary-soft" : "border-border bg-card"
            }`}
          >
            <div className={`h-16 rounded-lg mb-3 ${
              t === "light" ? "bg-background border border-border" :
              t === "dark" ? "bg-secondary" :
              "bg-gradient-to-br from-background to-secondary"
            }`} />
            <div className="text-sm font-medium capitalize">{t}</div>
            <div className="text-xs text-muted-foreground">{t === "system" ? "Match device" : `${t} theme`}</div>
          </button>
        ))}
      </div>
      <Separator className="my-5" />
      <Row
        title="Compact mode"
        description="Reduce padding & spacing across the interface."
        control={<Switch />}
      />
      <Row
        title="Reduce motion"
        description="Minimize animations and transitions."
        control={<Switch />}
      />
    </Panel>
  );
}

function Regional() {
  const {
    t,
    currency, setCurrency,
    language, setLanguage,
    timezone, setTimezone,
    dateFormat, setDateFormat,
    handleSave
  } = useRegionalSettings();

  return (
    <Panel title={t('regional_preferences')} description={t('currency_language_timezone')}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('currency')}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="inr">₹ Indian Rupee (INR)</SelectItem>
              <SelectItem value="usd">$ US Dollar (USD)</SelectItem>
              <SelectItem value="eur">€ Euro (EUR)</SelectItem>
              <SelectItem value="gbp">£ Pound (GBP)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('language')}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('timezone')}</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ist">Asia/Kolkata (IST)</SelectItem>
              <SelectItem value="utc">UTC</SelectItem>
              <SelectItem value="pst">America/Los_Angeles</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('date_format')}</Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
              <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
              <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} className="gradient-primary text-primary-foreground shadow-glow">
          <Save className="h-4 w-4 mr-2" /> {t('save_preferences')}
        </Button>
      </div>
    </Panel>
  );
}

function Billing() {
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

function GstSettings() {
  const {
    gstEnabled, setGstEnabled,
    gstNumber, setGstNumber,
    defaultGstRate, setDefaultGstRate,
    businessState, setBusinessState,
    isSaving,
    handleSave
  } = useGstSettings();

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
  ];

  return (
    <Panel 
      title="GST Configuration" 
      description="Enable and configure tax settings for your business invoices."
    >
      <div className="space-y-6">
        <Row
          title="Enable GST"
          description="Automatically calculate CGST/SGST or IGST on all new invoices."
          control={<Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />}
        />
        
        <Separator />

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">GST Number</Label>
            <Input 
              value={gstNumber} 
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())} 
              placeholder="24ABCDE1234F1Z5" 
              disabled={!gstEnabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Default GST Rate (%)</Label>
            <Select 
              value={defaultGstRate.toString()} 
              onValueChange={(val) => setDefaultGstRate(parseInt(val))}
              disabled={!gstEnabled}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Exempt)</SelectItem>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="12">12%</SelectItem>
                <SelectItem value="18">18% (Standard)</SelectItem>
                <SelectItem value="28">28%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Business Registered State</Label>
            <Select 
              value={businessState} 
              onValueChange={setBusinessState}
              disabled={!gstEnabled}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Used to determine if tax should be split into CGST+SGST or IGST.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gradient-primary text-primary-foreground shadow-glow h-10 px-6 rounded-xl"
          >
            {isSaving ? "Saving..." : "Save GST Settings"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function DeleteAccountZone() {
  const {
    isDeleting,
    handleDelete
  } = useDeleteAccount();

  return (
    <Panel title="Delete Account" description="Irreversible actions. Proceed with care.">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive-soft p-4">
          <div>
            <div className="text-sm font-medium text-destructive">Export & delete account</div>
            <div className="text-xs text-destructive/80 mt-1">
              Permanently delete your workspace, invoices and clients.
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" /> {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
