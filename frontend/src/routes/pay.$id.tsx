import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import axios from "axios";
import { AppShell } from "@/components/layout/AppShell";
import { PublicInvoiceCard } from "@/components/invoices/PublicInvoiceCard";
import { PublicPaymentCard } from "@/components/invoices/PublicPaymentCard";

export const Route = createFileRoute("/pay/$id")({
  loader: async ({ params }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/${params.id}`);
      
      const token = localStorage.getItem("pay_tracker_token");
      let logs = [];
      if (token) {
        try {
          const logsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/users/activity?invoiceId=${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          logs = logsResponse.data.data;
        } catch (e) {
          console.error("Failed to fetch logs:", e);
        }
      }

      return { invoice: response.data.data, logs };
    } catch (error) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Pay ${loaderData?.invoice?.invoiceNumber ?? "invoice"} — Pay Tracker` },
      { name: "description", content: "Secure payment via UPI or Razorpay." },
    ],
  }),
  component: PublicPay,
});

import { usePublicPay } from "@/hooks/usePublicPay";
import { InvoiceTimeline } from "@/components/invoices/InvoiceTimeline";

const mapActionToType = (action: string): "created" | "reminder" | "opened" | "pending" | "escalation" | "responded" | "paid" => {
  switch (action) {
    case "INVOICE_CREATED": return "created";
    case "REMINDER_SENT": return "reminder";
    case "EMAIL_OPENED": return "opened";
    case "PAYMENT_PENDING": return "pending";
    case "ESCALATION_SENT": return "escalation";
    case "CLIENT_RESPONDED": return "responded";
    case "PAYMENT_RECEIVED": return "paid";
    default: return "pending";
  }
};

const mapActionToTitle = (action: string): string => {
  switch (action) {
    case "INVOICE_CREATED": return "Invoice Created";
    case "REMINDER_SENT": return "Reminder Sent";
    case "EMAIL_OPENED": return "Email Opened";
    case "PAYMENT_PENDING": return "Payment Pending";
    case "ESCALATION_SENT": return "Escalation Sent";
    case "CLIENT_RESPONDED": return "Client Responded";
    case "PAYMENT_RECEIVED": return "Paid";
    default: return action.replace(/_/g, " ");
  }
};

function PublicPay() {
  const { invoice, logs } = Route.useLoaderData();
  const router = useRouter();

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
  } = usePublicPay(invoice);

  // Poll for real-time payment status updates
  useEffect(() => {
    if (status !== "PAID") {
      const interval = setInterval(() => {
        router.invalidate();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status, router]);

  const timelineEvents = logs.map((log: any) => ({
    id: log._id,
    type: mapActionToType(log.action),
    date: log.createdAt,
    title: mapActionToTitle(log.action),
    desc: log.details,
  }));

  // Fallback to mock data if no logs found (for demo)
  const displayEvents = timelineEvents.length > 0 ? timelineEvents : [
    { id: "1", type: "created" as const, date: new Date(Date.now() - 432000000).toISOString(), title: "Invoice Created", desc: "Invoice created and sent to client." },
    { id: "2", type: "reminder" as const, date: new Date(Date.now() - 345600000).toISOString(), title: "Reminder Sent", desc: "Automated reminder sent to client." },
    { id: "3", type: "opened" as const, date: new Date(Date.now() - 259200000).toISOString(), title: "Email Opened", desc: "Client viewed the invoice link." },
    { id: "4", type: "pending" as const, date: new Date(Date.now() - 172800000).toISOString(), title: "Payment Pending", desc: "Invoice is pending for 5 days." },
    { id: "5", type: "escalation" as const, date: new Date(Date.now() - 86400000).toISOString(), title: "Escalation Sent", desc: "Strict follow-up sent via email." },
    { id: "6", type: "paid" as const, date: new Date().toISOString(), title: "Paid", desc: "Payment received via UPI." }
  ];

  return (
    <AppShell variant={user ? "app" : "minimal"}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <PublicInvoiceCard inv={invoice} total={total} status={status} />
          <PublicPaymentCard
            isCreator={isCreator}
            status={status}
            qrUrl={qrUrl}
            copy={copy}
            copied={copied}
            upiId={upiId}
            inv={invoice}
            downloadPDF={downloadPDF}
          />
        </div>

        {isCreator && (
          <div className="mt-6">
            <InvoiceTimeline events={displayEvents} />
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Need help? Email <span className="font-medium text-foreground">support@paytracker.com</span>
        </p>
      </div>
    </AppShell>
  );
}
