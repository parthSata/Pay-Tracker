import { useState } from "react";
import { Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CreateInvoiceFormProps {
  user: any;
  client: string;
  setClient: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  due: string;
  setDue: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  clientState: string;
  setClientState: (v: string) => void;
  gstRate: number;
  setGstRate: (v: number) => void;
  isSubmitting: boolean;
  emailWarning: string;
  checkEmail: (email: string) => void;
  handleSend: () => void;
  states: string[];
}

function FloatingInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  prefix?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
        {label}
      </Label>
      <div
        className={`flex min-h-[52px] items-stretch rounded-xl border bg-card transition-all ${focused ? "border-primary ring-4 ring-primary/10" : "border-border"
          }`}
      >
        {prefix && (
          <div className="flex items-center justify-center px-3.5 border-r border-border text-muted-foreground text-sm font-medium bg-muted/30">
            {prefix}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          className="flex-1 bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
}

export function CreateInvoiceForm({
  user,
  client,
  setClient,
  email,
  setEmail,
  amount,
  setAmount,
  due,
  setDue,
  notes,
  setNotes,
  clientState,
  setClientState,
  gstRate,
  setGstRate,
  isSubmitting,
  emailWarning,
  checkEmail,
  handleSend,
  states,
}: CreateInvoiceFormProps) {
  return (
    <div className="lg:col-span-3 space-y-5 rounded-2xl bg-card border border-border p-6 shadow-card animate-fade-up">
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</div>
        <FloatingInput label="Client name" value={client} onChange={setClient} />
        <div className="space-y-1">
          <FloatingInput
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            onBlur={() => checkEmail(email)}
          />
          {emailWarning && <p className="text-[11px] text-amber-500 font-medium px-1 mt-1 animate-fade-in">{emailWarning}</p>}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput label="Amount" prefix="₹" value={amount} onChange={setAmount} />
          <FloatingInput label="Due date" type="date" value={due} onChange={setDue} />
        </div>
      </div>

      {user?.gstEnabled && (
        <>
          <div className="h-px bg-border" />

          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Client State</Label>
                <Select value={clientState} onValueChange={setClientState}>
                  <SelectTrigger className="rounded-xl border-border bg-card h-[52px] shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">GST Rate (%)</Label>
                <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(parseInt(v))}>
                  <SelectTrigger className="rounded-xl border-border bg-card h-[52px] shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exempt)</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18% (Standard)</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Thanks for your business!"
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSend}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Creating..." : "Send invoice"}
        </button>
      </div>
    </div>
  );
}
