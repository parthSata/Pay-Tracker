import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useAuth } from "../auth";
import { downloadInvoicePDF } from "@/lib/pdf";

export function useSearch() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [email, setEmail] = useState("");
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { user } = useAuth();

  const isCreator = user && invoice && user._id === (invoice.userId?._id || invoice.userId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInvoice(null);
    setQrCodeUrl("");
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/search`, {
        params: { invoiceNumber, email }
      });
      setInvoice(response.data.data);
      
      const qrUrl = await QRCode.toDataURL(window.location.origin + "/pay/" + response.data.data._id);
      setQrCodeUrl(qrUrl);

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invoice not found");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = () => {
    if (invoice) {
      downloadInvoicePDF("invoice-print-container", invoice.invoiceNumber);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !invoice) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("proof", e.target.files[0]);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/invoices/${invoice._id}/proof`, formData);
      toast.success("Payment proof uploaded successfully");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/search`, {
        params: { invoiceNumber, email }
      });
      setInvoice(response.data.data);
    } catch (error) {
      toast.error("Failed to upload proof");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    invoiceNumber, setInvoiceNumber,
    email, setEmail,
    invoice,
    isLoading,
    isUploading,
    qrCodeUrl,
    isCreator,
    handleSearch,
    downloadPDF,
    handleFileUpload
  };
}
