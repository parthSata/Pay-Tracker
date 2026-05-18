import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useRegionalSettings } from "@/hooks/useSettings";
import { Panel } from "./SettingsComponents";

export function RegionalSection() {
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
