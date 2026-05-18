import { useState } from "react";
import { toast } from "sonner";

export function useInvoicePay(inv: any) {
  const [copied, setCopied] = useState(false);
  const status = inv.status;

  const tax = inv.gstAmount || 0;
  const total = inv.totalAmount || (inv.amount + tax);
  const upiId = inv.sme?.upiId || "merchant@upi";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(inv.sme?.businessName || inv.sme?.name)}&am=${total}&cu=INR&tn=${encodeURIComponent(`Invoice ${inv.invoiceNumber}`)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return {
    status,
    tax,
    total,
    upiId,
    upiUri,
    qrUrl,
    copied,
    copy
  };
}
