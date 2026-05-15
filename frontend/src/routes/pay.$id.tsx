import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { formatINR } from "@/lib/mock";
import { ShieldCheck, Copy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../auth";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, Download } from "lucide-react";

export const Route = createFileRoute("/pay/$id")({
  loader: async ({ params }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/${params.id}`);
      return response.data.data;
    } catch (error) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Pay ${loaderData?.invoiceNumber ?? "invoice"} — Pay Tracker` },
      { name: "description", content: "Secure payment via UPI or Razorpay." },
    ],
  }),
  component: PublicPay,
});

function PublicPay() {
  const inv = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const status = inv.status;
  const { user } = useAuth();
  const isCreator = user && inv && (user._id === (inv.sme?._id || inv.userId?._id || inv.userId));

  const [qrUrl, setQrUrl] = useState("");
  const tax = inv.gstAmount || 0;
  const total = inv.totalAmount || (inv.amount + tax);
  const upiId = inv.userId?.upiId || "merchant@upi";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(inv.userId?.businessName || inv.userId?.name || "Merchant")}&am=${total}&cu=INR&tn=${encodeURIComponent(`Invoice ${inv.invoiceNumber}`)}`;

  useEffect(() => {
    QRCode.toDataURL(upiUri, { width: 400, margin: 1 }).then(setQrUrl).catch(console.error);
  }, [upiUri]);

  const copy = async () => {
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied");
    setTimeout(() => setCopied(false), 1500);
  };
  const downloadPDF = () => {
    window.print();
  };
  return (
    <AppShell variant={user ? "app" : "minimal"}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Invoice card */}
          <div id="invoice-card" className="lg:col-span-3 space-y-6">
            <div className="rounded-3xl bg-card border border-border shadow-pop p-6 lg:p-8 animate-fade-up">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="h-10 w-10 rounded-xl gradient-primary mb-3 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {(inv.userId?.businessName || inv.userId?.name || "B").split(" ").map((n: any) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="text-lg font-bold tracking-tight">{inv.userId?.businessName || "Business Merchant"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                    {inv.userId?.name} {inv.userId?.gstNumber && `· GST: ${inv.userId.gstNumber}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice</div>
                  <div className="font-mono text-base font-semibold">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Issued {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 py-5 border-y border-border">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Bill to</div>
                  <div className="text-sm font-semibold">{inv.clientName}</div>
                  <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Due date</div>
                  <div className="text-sm font-semibold">
                    {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="py-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Value</span>
                  <span className="tabular-nums font-medium">{formatINR(inv.amount)}</span>
                </div>
                {inv.taxType === "CGST_SGST" ? (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground/80 pl-4">
                      <span>CGST ({inv.gstRate / 2}%)</span>
                      <span className="tabular-nums">{formatINR(inv.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground/80 pl-4">
                      <span>SGST ({inv.gstRate / 2}%)</span>
                      <span className="tabular-nums">{formatINR(inv.sgst)}</span>
                    </div>
                  </>
                ) : inv.taxType === "IGST" ? (
                  <div className="flex justify-between text-xs text-muted-foreground/80 pl-4">
                    <span>IGST ({inv.gstRate}%)</span>
                    <span className="tabular-nums">{formatINR(inv.igst)}</span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl bg-secondary text-secondary-foreground p-5 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Amount due</div>
                  <div className="text-3xl font-semibold tracking-tight tabular-nums mt-1">{formatINR(total)}</div>
                </div>
                <div className="text-[11px] opacity-70 text-right">
                  Status<br />
                  <span className={`font-medium uppercase tracking-wider ${status === 'PAID' ? 'text-success' : 'text-primary'}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment card */}
          {!isCreator && (
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-3xl bg-card border border-border shadow-pop p-6 animate-scale-in" style={{ animationDelay: "120ms" }}>
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">Scan to pay</div>
                  <div className="text-base font-semibold mt-1">UPI · GPay · PhonePe · Paytm</div>
                </div>

                <div className="mt-5 mx-auto w-52 h-52 rounded-2xl bg-white p-3 shadow-card animate-fade-in border border-border flex items-center justify-center overflow-hidden">
                  {status === "PAID" ? (
                    <div className="flex flex-col items-center gap-2 text-success">
                      <CheckCircle2 className="h-12 w-12" />
                      <span className="text-xs font-bold uppercase">Paid</span>
                    </div>
                  ) : (
                    <img src={qrUrl} alt="Payment QR" className="w-full h-full object-contain" />
                  )}
                </div>

                <button
                  onClick={copy}
                  disabled={status === "PAID"}
                  className="mt-5 w-full group flex items-center justify-between rounded-xl border border-border bg-muted/40 hover:bg-accent transition-colors px-3.5 py-2.5 disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">UPI ID</div>
                    <div className="text-sm font-mono font-medium">{upiId}</div>
                  </div>
                  <span className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${copied ? "bg-success text-success-foreground scale-110" : "bg-card text-muted-foreground"}`}>
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </span>
                </button>

                {status === "PAID" ? (
                  <div className="w-full rounded-xl bg-success/10 text-success py-3 text-center font-bold">
                    Payment Complete
                  </div>
                ) : inv.paymentLink ? (
                  <button
                    onClick={() => window.open(inv.paymentLink, "_blank")}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-bold shadow-glow hover:scale-[1.02] transition-all"
                  >
                    Pay via Razorpay (Online)
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="text-center text-xs text-muted-foreground p-4 rounded-xl border border-dashed border-border">
                    Online payment link not generated. Please contact the merchant.
                  </div>
                )}

                <button
                  onClick={downloadPDF}
                  className="w-full mt-4 flex-1 border border-border bg-muted/30 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors print:hidden"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-card flex items-center gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
                <div className="h-9 w-9 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-foreground">256-bit secure payment</div>
                  <div className="text-muted-foreground">Powered by Razorpay & UPI · PCI-DSS compliant</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Need help? Email <span className="font-medium text-foreground">support@paytracker.com</span>
        </p>
      </div>
    </AppShell>
  );
}
