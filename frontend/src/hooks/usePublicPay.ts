import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { useRouter } from "@tanstack/react-router";

const mapActionToType = (action: string): "created" | "reminder" | "opened" | "pending" | "escalation" | "responded" | "paid" => {
  switch (action) {
    case "INVOICE_CREATED": return "created";
    case "REMINDER_SENT": return "reminder";
    case "EMAIL_OPENED": return "opened";
    case "PAYMENT_PENDING": return "pending";
    case "ESCALATION_SENT": return "escalation";
    case "CLIENT_RESPONDED": return "responded";
    case "PAYMENT_RECEIVED": return "paid";
    default: return "pending";
  }
};

const mapActionToTitle = (action: string): string => {
  switch (action) {
    case "INVOICE_CREATED": return "Invoice Created";
    case "REMINDER_SENT": return "Reminder Sent";
    case "EMAIL_OPENED": return "Email Opened";
    case "PAYMENT_PENDING": return "Payment Pending";
    case "ESCALATION_SENT": return "Escalation Sent";
    case "CLIENT_RESPONDED": return "Client Responded";
    case "PAYMENT_RECEIVED": return "Paid";
    default: return action.replace(/_/g, " ");
  }
};

export function usePublicPay(inv: any, logs: any[] = []) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const status = inv?.status;
  const { user } = useAuth();
  const isCreator = !!(user && inv && (user._id === (inv.sme?._id || inv.userId?._id || inv.userId)));

  const [qrUrl, setQrUrl] = useState("");
  const tax = inv?.gstAmount || 0;
  const total = inv?.totalAmount || ((inv?.amount || 0) + tax);
  const upiId = inv?.userId?.upiId || "merchant@upi";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(inv?.userId?.businessName || inv?.userId?.name || "Merchant")}&am=${total}&cu=INR&tn=${encodeURIComponent(`Invoice ${inv?.invoiceNumber}`)}`;

  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, { width: 400, margin: 1 }).then(setQrUrl).catch(console.error);
    }
  }, [upiUri]);

  // Poll for real-time payment status updates
  useEffect(() => {
    if (status !== "PAID") {
      const interval = setInterval(() => {
        router.invalidate();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status, router]);

  const copy = async () => {
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied");
    setTimeout(() => setCopied(false), 1500);
  };
  
  const downloadPDF = () => {
    window.print();
  };

  const timelineEvents = logs.map((log: any) => ({
    id: log._id,
    type: mapActionToType(log.action),
    date: log.createdAt,
    title: mapActionToTitle(log.action),
    desc: log.details,
  }));

  // Fallback to mock data if no logs found (for demo)
  const displayEvents = timelineEvents.length > 0 ? timelineEvents : [
    { id: "1", type: "created" as const, date: new Date(Date.now() - 432000000).toISOString(), title: "Invoice Created", desc: "Invoice created and sent to client." },
    { id: "2", type: "reminder" as const, date: new Date(Date.now() - 345600000).toISOString(), title: "Reminder Sent", desc: "Automated reminder sent to client." },
    { id: "3", type: "opened" as const, date: new Date(Date.now() - 259200000).toISOString(), title: "Email Opened", desc: "Client viewed the invoice link." },
    { id: "4", type: "pending" as const, date: new Date(Date.now() - 172800000).toISOString(), title: "Payment Pending", desc: "Invoice is pending for 5 days." },
    { id: "5", type: "escalation" as const, date: new Date(Date.now() - 86400000).toISOString(), title: "Escalation Sent", desc: "Strict follow-up sent via email." },
    { id: "6", type: "paid" as const, date: new Date().toISOString(), title: "Paid", desc: "Payment received via UPI." }
  ];

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
    downloadPDF,
    displayEvents
  };
}
