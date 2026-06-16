import { createFileRoute, notFound } from "@tanstack/react-router";
import axios from "axios";
import { usePublicPay } from "@/hooks/usePublicPay";
import { PublicPayView } from "@/components/invoices/PublicPayView";
import { getApiBaseUrl } from "@/lib/api";
import { z } from "zod";

const paySearchSchema = z.object({
  razorpay_payment_id: z.string().optional(),
  razorpay_payment_link_id: z.string().optional(),
  razorpay_payment_link_reference_id: z.string().optional(),
  razorpay_payment_link_status: z.string().optional(),
  razorpay_signature: z.string().optional(),
});

export const Route = createFileRoute("/pay/$id")({
  validateSearch: paySearchSchema,
  loader: async ({ params }) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await axios.get(`${apiBaseUrl}/invoices/${params.id}`);
      
      const token = localStorage.getItem("pay_tracker_token");
      let logs = [];
      if (token) {
        try {
          const logsResponse = await axios.get(`${apiBaseUrl}/users/activity?invoiceId=${params.id}`, {
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
      { name: "description", content: "Secure payment via Razorpay." },
    ],
  }),
  component: PublicPay,
});

function PublicPay() {
  const { invoice, logs } = Route.useLoaderData();
  const search = Route.useSearch();
  const publicPayProps = usePublicPay(invoice, logs, search);

  return <PublicPayView {...publicPayProps} invoice={invoice} />;
}

export default PublicPay;
