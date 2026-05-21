import { createFileRoute, notFound } from "@tanstack/react-router";
import axios from "axios";
import { usePublicPay } from "@/hooks/usePublicPay";
import { PublicPayView } from "@/components/invoices/PublicPayView";

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

function PublicPay() {
  const { invoice, logs } = Route.useLoaderData();
  const publicPayProps = usePublicPay(invoice, logs);

  return <PublicPayView {...publicPayProps} invoice={invoice} />;
}

export default PublicPay;
