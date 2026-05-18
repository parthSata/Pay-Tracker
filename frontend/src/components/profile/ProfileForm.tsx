import { Camera, Mail, MapPin, Building2, CreditCard, Save, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProfileFormProps {
  user: any;
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSave: () => void;
  isLoading: boolean;
}

export function ProfileForm({ user, formData, handleChange, handleSave, isLoading }: ProfileFormProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your business identity shown on every invoice & payment page.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {isLoading ? "Saving..." : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="h-28 gradient-primary relative">
          <div className="absolute inset-0 gradient-mesh opacity-50" />
        </div>
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold ring-4 ring-card shadow-pop">
              RA
            </div>
            <button
              onClick={() => toast("Upload coming soon")}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow hover:scale-110 transition-transform"
              aria-label="Upload avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-soft px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{formData.businessName || "Business owner"}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Invoices", value: "248" },
              { label: "Clients", value: "36" },
              { label: "Paid", value: "92%" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-lg font-semibold">{s.value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Personal information
        </h3>
        <Separator className="my-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" name="name" value={formData.name} onChange={handleChange} />
          <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
      </section>

      {/* Business */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Business details
        </h3>
        <Separator className="my-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business name" name="businessName" value={formData.businessName} onChange={handleChange} />
        </div>
      </section>

      {/* Payment */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Payment details
        </h3>
        <Separator className="my-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="UPI ID" name="upiId" value={formData.upiId} onChange={handleChange} />
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-primary-soft text-primary p-3 text-xs">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <p>These details are displayed on your public invoice payment page so clients can pay securely.</p>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input name={name} type={type} value={value} onChange={onChange} className="h-10" />
    </div>
  );
}
