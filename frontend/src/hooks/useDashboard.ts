import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNotifications } from "../context/NotificationContext";
import { formatINR } from "@/lib/mock";

export function useDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotif } = useNotifications();
  const lastInvoicesRef = useRef<any[]>([]);

  const fetchData = async () => {
    const token = localStorage.getItem("pay_tracker_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const emptyStats = { totalRevenue: 0, pending: 0, overdue: 0, cashflow: [] };

    try {
      const [invResult, statsResult, logsResult] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/invoices`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/invoices/stats`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/users/activity`, { headers }),
      ]);

      if (invResult.status === "fulfilled") {
        const raw = invResult.value.data?.data;
        const newInvoices = Array.isArray(raw) ? raw : [];
        const prevInvoices = lastInvoicesRef.current;
        if (prevInvoices.length > 0) {
          newInvoices.forEach((newInv: any) => {
            const oldInv = prevInvoices.find((i) => i._id === newInv._id);
            if (oldInv && oldInv.status === "PENDING" && newInv.status === "PAID") {
              addNotif({
                title: "Payment received (Auto)",
                description: `${newInv.clientName} paid ${newInv.invoiceNumber} · ${formatINR(newInv.amount * 1.18)}`,
                type: "success",
                category: "payment",
              });
            }
          });
        }
        lastInvoicesRef.current = newInvoices;
        setInvoices(newInvoices);
      } else {
        setInvoices([]);
      }

      if (statsResult.status === "fulfilled") {
        const s = statsResult.value.data?.data;
        setStats(s && typeof s === "object" ? s : emptyStats);
      } else {
        setStats(emptyStats);
      }

      if (logsResult.status === "fulfilled") {
        const raw = logsResult.value.data?.data;
        setLogs(Array.isArray(raw) ? raw : []);
      } else {
        setLogs([]);
      }

      const criticalFailed = invResult.status === "rejected" || statsResult.status === "rejected";
      if (criticalFailed) {
        toast.error("Failed to load dashboard data", { id: "dashboard-load-error" });
      } else {
        toast.dismiss("dashboard-load-error");
      }
    } catch {
      toast.error("Failed to load dashboard data", { id: "dashboard-load-error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refetch when user returns to the tab
    window.addEventListener("focus", fetchData);
    return () => window.removeEventListener("focus", fetchData);
  }, []);

  const totalRevenue = invoices
    .filter(inv => inv.status === "PAID")
    .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);
  const pending = invoices
    .filter(inv => inv.status === "PENDING")
    .reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);
  const overdue = stats?.overdue || 0;

  const generateWeeklyData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];

      const paidInvoices = invoices.filter(inv => {
        if (inv.status !== "PAID") return false;
        const invDate = new Date(inv.paidAt || inv.updatedAt || inv.createdAt);
        return invDate.getDate() === d.getDate() && invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
      });
      const paid = paidInvoices.reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);

      const pendingInvoices = invoices.filter(inv => {
        if (inv.status !== "PENDING") return false;
        const invDate = new Date(inv.createdAt);
        return invDate.getDate() === d.getDate() && invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
      });
      const pending = pendingInvoices.reduce((acc, curr) => acc + (curr.totalAmount || curr.amount), 0);

      result.push({ day: dayName, paid, pending });
    }
    return result;
  };

  const dynamicCashflow = stats?.cashflow?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    amount: item.amount
  })) || [];

  const dynamicWeekly = generateWeeklyData();

  return {
    invoices,
    logs,
    isLoading,
    totalRevenue,
    pending,
    overdue,
    dynamicCashflow,
    dynamicWeekly
  };
}
