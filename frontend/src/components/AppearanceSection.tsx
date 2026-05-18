import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppearanceSettings } from "@/hooks/useSettings";
import { Panel, Row } from "./SettingsComponents";

export function AppearanceSection() {
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
