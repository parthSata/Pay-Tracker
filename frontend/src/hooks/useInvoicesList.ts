import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNotifications } from "../context/NotificationContext";
import { formatINR, type InvoiceStatus } from "@/lib/utils";
import { useAuth } from "../auth";

export const filters: ("all" | InvoiceStatus)[] = ["all", "paid", "pending", "overdue"];

export function useInvoicesList() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [q, setQ] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotif } = useNotifications();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("pay_tracker_token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const newInvoices = response.data.data;
        
        if (invoices.length > 0) {
          newInvoices.forEach((newInv: any) => {
            const oldInv = invoices.find(i => i._id === newInv._id);
            if (oldInv && oldInv.status === "PENDING" && newInv.status === "PAID") {
              addNotif({
                title: "Payment received (Auto)",
                description: `${newInv.clientName} paid ${newInv.invoiceNumber} · ${formatINR(newInv.totalAmount || newInv.amount)}`,
                type: "success",
                category: "payment",
              });
            }
          });
        }

        setInvoices(newInvoices);
      } catch (error: any) {
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();

    window.addEventListener("focus", fetchInvoices);
    return () => window.removeEventListener("focus", fetchInvoices);
  }, []);

  const rows = useMemo(() => {
    return invoices.filter((i) => {
      const status = i.status.toLowerCase();
      const matchFilter = filter === "all" || status === filter;

      const matchQ = q === "" || 
        `${i.clientName} ${i.invoiceNumber} ${i.clientEmail}`.toLowerCase().includes(q.toLowerCase());
      return matchFilter && matchQ;
    });
  }, [filter, q, invoices]);

  const counts = {
    all: invoices.length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    pending: invoices.filter((i) => i.status === "PENDING").length,
    overdue: invoices.filter((i) => i.status === "OVERDUE").length,
    draft: 0
  };

  const handleExport = () => {
    if (user?.plan === "FREE") {
      toast.error("Advanced CSV Export is a premium feature. Please upgrade your plan.");
      return;
    }

    if (rows.length === 0) {
      toast.error("No invoices to export");
      return;
    }

    const headers = ["Invoice #", "Client Name", "Client Email", "Amount", "Due Date", "Status"];
    const csvRows = rows.map((inv) => [
      inv.invoiceNumber,
      `"${inv.clientName}"`,
      inv.clientEmail,
      inv.amount,
      new Date(inv.dueDate).toISOString().split('T')[0],
      inv.status,
    ]);

    const csvContent = [headers.join(","), ...csvRows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Invoices exported successfully");
  };

  return {
    filter,
    setFilter,
    q,
    setQ,
    invoices,
    isLoading,
    rows,
    counts,
    handleExport,
    filters
  };
}
