import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldCheck, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { PaymentSection } from "@/components/shared/PaymentSection";
import axios from "axios";

export const Route = createFileRoute("/invoices/pay/$id")({
  loader: async ({ params }) => {
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      throw notFound();
    }
  },
  component: DashboardPay,
});

import { useInvoicePay } from "@/hooks/useInvoicePay";

function DashboardPay() {
  const inv = Route.useLoaderData();
  const {
    status,
    total,
    upiId,
    qrUrl,
    copied,
    copy
  } = useInvoicePay(inv);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/invoices/received" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to received invoices
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.print()}>
               <Download className="h-4 w-4" />
               Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <InvoiceDetails inv={inv} upiId={upiId} total={total} />
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">Secure Payment Protection</div>
                <div className="text-xs text-muted-foreground leading-snug">This invoice is verified. Your payment is protected by 256-bit encryption and directly reaches the merchant.</div>
              </div>
            </div>
          </div>
          <PaymentSection status={status} qrUrl={qrUrl} copy={copy} copied={copied} upiId={upiId} inv={inv} />
        </div>
      </div>
    </AppShell>
  );
}
