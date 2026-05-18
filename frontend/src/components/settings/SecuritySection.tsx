import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Panel, Row } from "@/components/settings/SettingsComponents";

export function SecuritySection() {
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
