import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGstSettings } from "@/hooks/useSettings";
import { Panel, Row } from "@/components/settings/SettingsComponents";

export function GstSettingsSection() {
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
              maxLength={15}
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
