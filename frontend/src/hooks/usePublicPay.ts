import { useState, useEffect, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { useRouter } from "@tanstack/react-router";
import axios from "axios";

import { downloadInvoicePDF } from "@/lib/pdf";

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

// Fallback window if backend doesn't report one (must match backend PAYMENT_LOCK_WINDOW_MS).
const DEFAULT_LOCK_WINDOW_MS = 15 * 60 * 1000;
// After this much wall-clock time, surface a "Reset & try again" escape hatch so a
// payer who abandoned the Razorpay tab without paying isn't stuck forever.
const RESET_OFFER_AFTER_MS = 90 * 1000;

export function usePublicPay(inv: any, logs: any[] = [], searchParams?: any) {
  const router = useRouter();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  // Optimistic local lock so the UI flips to "Verifying" the instant the payer clicks
  // an online payment option — we don't wait for the next loader round-trip.
  const [localLockAt, setLocalLockAt] = useState<number | null>(null);
  // Drives "show reset escape-hatch" UI without re-rendering every tick.
  const [now, setNow] = useState<number>(() => Date.now());
  // Surfaced when Razorpay reports a failed payment attempt (via webhook or polling).
  // We keep the message in local state so the payer sees it even after we router.invalidate().
  const [paymentFailure, setPaymentFailure] = useState<{ reason: string; code: string | null } | null>(
    inv?.lastPaymentFailureAt && inv?.status !== "PAID"
      ? { reason: inv.lastPaymentFailureReason || "Payment could not be completed", code: inv.lastPaymentFailureCode || null }
      : null
  );

  const status: string = inv?.status;
  const isCreator = !!(user && inv && (user._id === (inv.sme?._id || inv.userId?._id || inv.userId)));

  const serverLockMs = typeof inv?.paymentLockWindowMs === "number" ? inv.paymentLockWindowMs : DEFAULT_LOCK_WINDOW_MS;
  const serverInitiatedAt = inv?.paymentInitiatedAt ? new Date(inv.paymentInitiatedAt).getTime() : null;
  // Honor whichever lock is fresher — the optimistic local one or the server one.
  const effectiveInitiatedAt = useMemo(() => {
    if (status === "PAID") return null;
    if (localLockAt && serverInitiatedAt) return Math.max(localLockAt, serverInitiatedAt);
    return localLockAt ?? serverInitiatedAt;
  }, [localLockAt, serverInitiatedAt, status]);

  // Razorpay's callback may land before the loader refetches the invoice — treat
  // that as an immediate lock so the verifying UI flashes instantly on return.
  const razorpayCallbackPresent = !!(
    searchParams?.razorpay_payment_id ||
    searchParams?.razorpay_payment_link_status === "paid" ||
    searchParams?.razorpay_payment_link_id
  );

  const lockElapsedMs = effectiveInitiatedAt ? now - effectiveInitiatedAt : 0;
  const lockExpired = effectiveInitiatedAt ? lockElapsedMs >= serverLockMs : false;
  const isPaymentLocked =
    status !== "PAID" &&
    !paymentFailure &&
    ((effectiveInitiatedAt !== null && !lockExpired) || (razorpayCallbackPresent && status !== "PAID"));

  // Show "Reset & try again" only after a soft timeout so panicked payers don't
  // immediately bypass the safety net.
  const canResetLock = isPaymentLocked && lockElapsedMs >= RESET_OFFER_AFTER_MS;

  const isVerifying = isPaymentLocked;

  const tax = inv?.gstAmount || 0;
  const total = inv?.totalAmount || ((inv?.amount || 0) + tax);
  const upiId = inv?.userId?.upiId || inv?.sme?.upiId || "merchant@upi";
  const merchantName = inv?.userId?.businessName || inv?.userId?.name || inv?.sme?.businessName || inv?.sme?.name || "Merchant";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR&tn=${encodeURIComponent(`Invoice ${inv?.invoiceNumber}`)}`;

  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, { width: 400, margin: 1 }).then(setQrUrl).catch(console.error);
    }
  }, [upiUri]);

  // Tick once a second only while a lock is live, so we can show countdown / reset UI.
  useEffect(() => {
    if (!isPaymentLocked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isPaymentLocked]);

  // Clear local lock whenever the server confirms PAID.
  useEffect(() => {
    if (status === "PAID" && localLockAt !== null) {
      setLocalLockAt(null);
    }
  }, [status, localLockAt]);

  // While locked, aggressively poll the verify-payment endpoint: it both fetches
  // Razorpay's authoritative status AND short-circuits to PAID the moment the webhook
  // arrives. On success we invalidate the loader to refresh the whole invoice.
  // It also reports `paymentFailed` so we can exit the verifying state on a failed attempt.
  useEffect(() => {
    if (!isPaymentLocked || !inv?._id) return;
    let active = true;

    const checkPayment = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/${inv._id}/verify-payment`);
        if (!active) return;
        const data = res.data?.data;
        if (data?.verified) {
          toast.success("Payment verified successfully!");
          setPaymentFailure(null);
          setLocalLockAt(null);
          router.invalidate();
          return;
        }
        if (data?.paymentFailed) {
          const reason: string = data.failureReason || "Payment could not be completed";
          setPaymentFailure({ reason, code: data.failureCode || null });
          setLocalLockAt(null);
          toast.error(`Payment failed: ${reason}`);
          router.invalidate();
        }
      } catch (e) {
        console.error("Verification error:", e);
      }
    };

    checkPayment();
    const interval = setInterval(checkPayment, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isPaymentLocked, inv?._id, router]);

  // Keep failure UI in sync when the loader brings fresh invoice data.
  // (e.g., webhook fired → re-fetch → invoice has lastPaymentFailureAt populated)
  useEffect(() => {
    if (inv?.status === "PAID") {
      setPaymentFailure(null);
      return;
    }
    if (inv?.lastPaymentFailureAt && inv?.lastPaymentFailureReason) {
      setPaymentFailure({
        reason: inv.lastPaymentFailureReason,
        code: inv.lastPaymentFailureCode || null,
      });
    }
  }, [inv?.status, inv?.lastPaymentFailureAt, inv?.lastPaymentFailureReason, inv?.lastPaymentFailureCode]);

  // Light background polling for pending invoices that are NOT actively verifying —
  // catches UPI payments / manual marks-as-paid that don't go through the lock flow.
  useEffect(() => {
    if (status === "PAID" || isPaymentLocked) return;
    const interval = setInterval(() => router.invalidate(), 5000);
    return () => clearInterval(interval);
  }, [status, isPaymentLocked, router]);

  const copy = useCallback(async () => {
    if (isPaymentLocked || status === "PAID") return;
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied");
    setTimeout(() => setCopied(false), 1500);
  }, [isPaymentLocked, status, upiId]);

  const downloadPDF = useCallback(() => {
    if (inv) {
      downloadInvoicePDF("invoice-print-container", inv.invoiceNumber);
    }
  }, [inv]);

  /**
   * Stamp the verification lock on the backend BEFORE handing control to the payment
   * provider. We do this first so even if the user closes/refreshes the page, the
   * server still remembers the lock — preventing duplicate payments via UPI/QR on
   * the same invoice.
   */
  const initiateOnlinePayment = useCallback(async () => {
    if (!inv?._id || status === "PAID" || !inv?.paymentLink) return;
    // A fresh attempt clears any prior failure banner.
    setPaymentFailure(null);
    setLocalLockAt(Date.now());
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/invoices/${inv._id}/initiate-payment`);
    } catch (e) {
      console.error("Failed to mark payment as initiated:", e);
    } finally {
      window.open(inv.paymentLink, "_blank", "noopener,noreferrer");
      router.invalidate();
    }
  }, [inv?._id, inv?.paymentLink, status, router]);

  const dismissPaymentFailure = useCallback(() => {
    setPaymentFailure(null);
  }, []);

  const resetPaymentLock = useCallback(async () => {
    if (!inv?._id) return;
    setLocalLockAt(null);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/invoices/${inv._id}/reset-payment-lock`);
      toast.success("Verification cleared — you can try again");
      router.invalidate();
    } catch (e) {
      console.error("Failed to clear verification lock:", e);
      toast.error("Could not clear verification. Please refresh and try again.");
    }
  }, [inv?._id, router]);

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
    isVerifying,
    isPaymentLocked,
    canResetLock,
    paymentFailure,
    dismissPaymentFailure,
    qrUrl,
    tax,
    total,
    upiId,
    copied,
    copy,
    downloadPDF,
    initiateOnlinePayment,
    resetPaymentLock,
    displayEvents,
  };
}
