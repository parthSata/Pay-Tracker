import { useState, useEffect } from "react";
import axios from "axios";

export interface ClientAnalytics {
  clientName: string;
  clientEmail: string;
  totalInvoices: number;
  unpaidInvoices: number;
  paidInvoices: number;
  unpaidRatio: number;
  averageDelayDays: number;
  latePaymentFrequency: number;
  riskLevel: string;
  riskColor: "RED" | "YELLOW" | "GREEN";
  insight: string;
}

export type RiskFilterType = "ALL" | "RED" | "YELLOW" | "GREEN";

export function useClientRisk() {
  const [clients, setClients] = useState<ClientAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RiskFilterType>("ALL");

  useEffect(() => {
    const fetchRiskScores = async () => {
      try {
        const token = localStorage.getItem("pay_tracker_token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/client-risk`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClients(res.data.data);
      } catch (err) {
        console.error("Failed to load client risk analysis", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskScores();
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.clientName.toLowerCase().includes(search.toLowerCase()) || 
                          c.clientEmail.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || c.riskColor === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: clients.length,
    red: clients.filter(c => c.riskColor === "RED").length,
    yellow: clients.filter(c => c.riskColor === "YELLOW").length,
    green: clients.filter(c => c.riskColor === "GREEN").length,
  };

  return {
    clients: filteredClients,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    counts
  };
}
