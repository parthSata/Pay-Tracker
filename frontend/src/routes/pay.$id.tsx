import { createFileRoute, notFound } from "@tanstack/react-router";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { PublicInvoiceCard } from "@/components/invoices/PublicInvoiceCard";
import { PublicPaymentCard } from "@/components/invoices/PublicPaymentCard";

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

import { usePublicPay } from "@/hooks/usePublicPay";

function PublicPay() {
  const inv = Route.useLoaderData();
  const {
    user,
    isCreator,
    status,
    qrUrl,
    total,
    upiId,
    copied,
    copy,
    downloadPDF
  } = usePublicPay(inv);
  return (
    <AppShell variant={user ? "app" : "minimal"}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <PublicInvoiceCard inv={inv} total={total} status={status} />
          <PublicPaymentCard
            isCreator={isCreator}
            status={status}
            qrUrl={qrUrl}
            copy={copy}
            copied={copied}
            upiId={upiId}
            inv={inv}
            downloadPDF={downloadPDF}
          />
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Need help? Email <span className="font-medium text-foreground">support@paytracker.com</span>
        </p>
      </div>
    </AppShell>
  );
}
