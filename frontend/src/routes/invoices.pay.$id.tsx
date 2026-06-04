import { createFileRoute, notFound } from "@tanstack/react-router";
import axios from "axios";
import { PublicPayView } from "@/components/invoices/PublicPayView";
import { usePublicPay } from "@/hooks/usePublicPay";

export const Route = createFileRoute("/invoices/pay/$id")({
  loader: async ({ params }) => {
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let logs = [];
      try {
        const logsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/users/activity?invoiceId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        logs = logsResponse.data.data;
      } catch (e) {
        console.error("Failed to fetch logs:", e);
      }

      return { invoice: response.data.data, logs };
    } catch (error) {
      throw notFound();
    }
  },
  component: DashboardPay,
});

function DashboardPay() {
  const { invoice, logs } = Route.useLoaderData();
  const search = Route.useSearch();
  const publicPayProps = usePublicPay(invoice, logs, search);

  return <PublicPayView {...publicPayProps} invoice={invoice} />;
}
