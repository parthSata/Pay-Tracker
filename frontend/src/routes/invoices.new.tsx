import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/mock";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "Create invoice — Pay Tracker" },
      { name: "description", content: "Create a professional invoice in seconds with live preview." },
    ],
  }),
  component: CreateInvoice,
});

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
        {prefix ? (
          <span className="flex w-10 shrink-0 items-center justify-center border-r border-border/60 text-sm text-muted-foreground tabular-nums select-none">
            {prefix}
          </span>
        ) : null}
        <input
          type={type}
          value={value}
          placeholder={label}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (onBlur) onBlur();
          }}
          className="w-full bg-transparent outline-none px-3.5 py-2.5 text-sm tabular-nums"
        />
      </div>
    </div>
  );
}

function CreateInvoice() {
  const { user } = useAuth();
  const [client, setClient] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [clientState, setClientState] = useState(user?.businessState || "Gujarat");
  const [gstRate, setGstRate] = useState(user?.gstEnabled ? user.defaultGstRate || 18 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");
  const navigate = useNavigate();

  const checkEmail = async (checkEmailStr: string) => {
    if (!checkEmailStr || !checkEmailStr.includes('@')) {
      setEmailWarning("");
      return;
    }
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/check-email?email=${checkEmailStr}`);
      if (!res.data?.data?.exists) {
        setEmailWarning("Warning: Client email is not registered in Pay-Tracker.");
      } else {
        setEmailWarning("");
      }
    } catch (e) {
      setEmailWarning("");
    }
  };

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
  ];

  const amountNum = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const gstAmount = Math.round((amountNum * gstRate) / 100);
  const total = amountNum + gstAmount;
  const isSameState = user?.businessState === clientState;
  const taxType = gstRate > 0 ? (isSameState ? "CGST_SGST" : "IGST") : "NONE";

  const handleSend = async () => {
    if (!client || !email || !amountNum || !due) {
      toast.error("Please fill client name, email, amount and due date");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.post(`${import.meta.env.VITE_API_URL}/invoices`, {
        clientName: client,
        clientEmail: email,
        clientState,
        amount: amountNum,
        gstRate,
        dueDate: due,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Invoice created successfully!", {
        description: `${client} · ${formatINR(total)}`
      });

      // Navigate back to invoices list
      navigate({ to: "/invoices" });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create invoice";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/invoices" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to invoices
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight mt-2">Create invoice</h1>
            <p className="text-sm text-muted-foreground mt-1">Fill in the details — your client sees the preview on the right.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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

          <div className="lg:col-span-2">
            <div className="sticky top-24 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Live preview
              </div>
              <div className="rounded-2xl bg-card border border-border shadow-pop p-6 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="h-9 w-9 rounded-lg gradient-primary mb-2 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter">
                      {(user?.businessName || user?.name || "B").split(" ").map((n: any) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="text-sm font-semibold">{user?.businessName || user?.name || "Business Merchant"}</div>
                    <div className="text-[11px] text-muted-foreground">{user?.email || "hello@merchant.in"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</div>
                    <div className="font-mono text-sm font-semibold">#INV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bill to</div>
                    <div className="text-sm font-medium">{client || "Client name"}</div>
                    <div className="text-xs text-muted-foreground">{email || "client@email.com"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due</div>
                    <div className="text-sm font-medium">
                      {due ? new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Amount</span>
                    <span className="tabular-nums">{formatINR(amountNum)}</span>
                  </div>
                  {taxType === "CGST_SGST" ? (
                    <>
                      <div className="flex justify-between text-[11px] text-muted-foreground/80 pl-2">
                        <span>CGST ({gstRate / 2}%)</span>
                        <span className="tabular-nums">{formatINR(gstAmount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground/80 pl-2">
                        <span>SGST ({gstRate / 2}%)</span>
                        <span className="tabular-nums">{formatINR(gstAmount / 2)}</span>
                      </div>
                    </>
                  ) : taxType === "IGST" ? (
                    <div className="flex justify-between text-[11px] text-muted-foreground/80 pl-2">
                      <span>IGST ({gstRate}%)</span>
                      <span className="tabular-nums">{formatINR(gstAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                    <span>Total (Incl. Tax)</span>
                    <span className="tabular-nums text-primary">{formatINR(total)}</span>
                  </div>
                </div>

                {notes && (
                  <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground italic">
                    "{notes}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
