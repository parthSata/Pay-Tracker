import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "../../context/NotificationContext";
import { Panel, Row } from "@/components/settings/SettingsComponents";

export function NotificationsSection() {
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
