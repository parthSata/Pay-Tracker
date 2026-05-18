import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useReceivedInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("pay_tracker_token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/received`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setInvoices(response.data.data);
      } catch (error: any) {
        toast.error("Failed to load received invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return { invoices, isLoading };
}
