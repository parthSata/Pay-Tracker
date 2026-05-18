import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useAuth } from "../auth";

export function usePublicPay(inv: any) {
  const [copied, setCopied] = useState(false);
  const status = inv.status;
  const { user } = useAuth();
  const isCreator = user && inv && (user._id === (inv.sme?._id || inv.userId?._id || inv.userId));

  const [qrUrl, setQrUrl] = useState("");
  const tax = inv.gstAmount || 0;
  const total = inv.totalAmount || (inv.amount + tax);
  const upiId = inv.userId?.upiId || "merchant@upi";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(inv.userId?.businessName || inv.userId?.name || "Merchant")}&am=${total}&cu=INR&tn=${encodeURIComponent(`Invoice ${inv.invoiceNumber}`)}`;

  useEffect(() => {
    QRCode.toDataURL(upiUri, { width: 400, margin: 1 }).then(setQrUrl).catch(console.error);
  }, [upiUri]);

  const copy = async () => {
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied");
    setTimeout(() => setCopied(false), 1500);
  };
  
  const downloadPDF = () => {
    window.print();
  };

  return {
    user,
    isCreator,
    status,
    qrUrl,
    tax,
    total,
    upiId,
    copied,
    copy,
    downloadPDF
  };
}
