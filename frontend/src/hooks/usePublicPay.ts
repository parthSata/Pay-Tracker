import { useState, useEffect, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { useRouter } from "@tanstack/react-router";
import axios from "axios";

import { getApiBaseUrl } from "@/lib/api";
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

const loadRazorpayCheckout = () =>
  new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export function usePublicPay(inv: any, logs: any[] = [], searchParams?: any) {
  const router = useRouter();
  const { user } = useAuth();
  const apiBaseUrl = getApiBaseUrl();

  // Optimistic local lock so the UI flips to "Verifying" the instant the payer clicks
  // an online payment option — we don't wait for the next loader round-trip.
  const [localLockAt, setLocalLockAt] = useState<number | null>(null);
  const [, setLocalLockChannel] = useState<"RAZORPAY" | null>(null);
  const [paymentLinkQrUrl, setPaymentLinkQrUrl] = useState("");
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

  useEffect(() => {
    if (!inv?.paymentLink) {
      setPaymentLinkQrUrl("");
      return;
    }
    QRCode.toDataURL(inv.paymentLink, { width: 360, margin: 1 })
      .then(setPaymentLinkQrUrl)
      .catch(() => setPaymentLinkQrUrl(""));
  }, [inv?.paymentLink]);

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
      setLocalLockChannel(null);
    }
  }, [status, localLockAt]);

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
    if (!inv?._id || status === "PAID") return;

    let cancelled = false;

    const pollVerification = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/invoices/${inv._id}/verify-payment`);
        if (cancelled) return;

        const verification = response.data?.data || {};

        if (verification.verified || verification.status === "PAID") {
          setPaymentFailure(null);
          setLocalLockAt(null);
          setLocalLockChannel(null);
          router.invalidate();
          return;
        }

        if (verification.paymentFailed && verification.failureReason) {
          setPaymentFailure({
            reason: verification.failureReason,
            code: verification.failureCode || null,
          });
          router.invalidate();
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Background payment verification failed:", error);
        }
      }
    };

    pollVerification();
    const interval = setInterval(pollVerification, isPaymentLocked ? 3000 : 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiBaseUrl, inv?._id, isPaymentLocked, router, status]);

  const downloadPDF = useCallback(() => {
    if (inv) {
      downloadInvoicePDF("invoice-print-container", inv.invoiceNumber);
    }
  }, [inv]);

  /**
   * Stamp the verification lock on the backend BEFORE handing control to the payment
   * provider. We do this first so even if the user closes/refreshes the page, the
   * server still remembers the lock and avoids duplicate Razorpay attempts.
   */
  const releaseLockSilently = useCallback(async () => {
    if (!inv?._id) return;
    try {
      await axios.post(`${apiBaseUrl}/invoices/${inv._id}/reset-payment-lock`);
    } catch (e) {
      console.error("Failed to silently clear verification lock:", e);
    }
  }, [apiBaseUrl, inv?._id]);

  const markPaymentInitiated = useCallback(async () => {
    if (!inv?._id || status === "PAID") return false;
    try {
      setPaymentFailure(null);
      setLocalLockAt(Date.now());
      setLocalLockChannel("RAZORPAY");
      await axios.post(`${apiBaseUrl}/invoices/${inv._id}/initiate-payment`, {});
      return true;
    } catch (e) {
      console.error("Failed to mark payment as initiated:", e);
      setLocalLockAt(null);
      setLocalLockChannel(null);
      return false;
    }
  }, [apiBaseUrl, inv?._id, status]);

  const initiateOnlinePayment = useCallback(async () => {
    if (!inv?._id || status === "PAID") return;

    const checkoutLoaded = await loadRazorpayCheckout();
    if (!checkoutLoaded || !(window as any).Razorpay) {
      toast.error("Could not load Razorpay Checkout. Please refresh and try again.");
      return;
    }

    setPaymentFailure(null);
    setLocalLockAt(Date.now());
    setLocalLockChannel("RAZORPAY");

    try {
      const orderResponse = await axios.post(`${apiBaseUrl}/invoices/${inv._id}/razorpay-order`);
      const order = orderResponse.data?.data;
      if (!order?.orderId || !order?.key) {
        throw new Error("Razorpay order could not be created");
      }

      const Razorpay = (window as any).Razorpay;
      const razorpayOptions: any = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: order.name || "Pay Tracker",
        description: order.description || `Invoice ${inv.invoiceNumber}`,
        order_id: order.orderId,
        prefill: {
          name: order.clientName || inv.clientName || "",
          email: order.clientEmail || inv.clientEmail || "",
        },
        notes: {
          invoice_id: inv._id,
          invoice_number: inv.invoiceNumber,
        },
        ...(order.checkoutOptions || {}),
        handler: async (response: any) => {
          try {
            const verifyResponse = await axios.post(
              `${apiBaseUrl}/invoices/${inv._id}/verify-razorpay-order`,
              response
            );
            if (verifyResponse.data?.data?.verified) {
              toast.success("Payment verified successfully!");
              setPaymentFailure(null);
              setLocalLockAt(null);
              setLocalLockChannel(null);
              router.invalidate();
            }
          } catch (e) {
            const axiosError = e as any;
            console.error("Razorpay order verification failed:", axiosError?.response?.data || axiosError);
            toast.error("Payment verification failed. Please wait or contact the merchant.");
            router.invalidate();
          }
        },
        modal: {
          ondismiss: async () => {
            setLocalLockAt(null);
            setLocalLockChannel(null);
            await releaseLockSilently();
            router.invalidate();
          },
        },
      };
      const checkout = new Razorpay(razorpayOptions);

      checkout.on("payment.failed", async (response: any) => {
        const error = response?.error || {};
        const reason = error.reason || error.description || "Payment could not be completed";
        setPaymentFailure({ reason, code: error.code || null });
        setLocalLockAt(null);
        setLocalLockChannel(null);
        toast.error(`Payment failed: ${reason}`);
        await releaseLockSilently();
        router.invalidate();
      });

      checkout.open();
    } catch (e) {
      console.error("Failed to open Razorpay Checkout:", e);
      setLocalLockAt(null);
      setLocalLockChannel(null);
      toast.error("Could not start Razorpay payment. Please try again.");
    }
  }, [apiBaseUrl, inv?._id, inv?.invoiceNumber, inv?.clientName, inv?.clientEmail, status, router, releaseLockSilently]);

  const openPaymentLink = useCallback(async () => {
    if (!inv?.paymentLink || status === "PAID") return;
    await markPaymentInitiated();
    window.open(inv.paymentLink, "_blank", "noopener,noreferrer");
  }, [inv?.paymentLink, markPaymentInitiated, status]);

  const dismissPaymentFailure = useCallback(() => {
    setPaymentFailure(null);
  }, []);

  const resetPaymentLock = useCallback(async () => {
    if (!inv?._id) return;
    setLocalLockAt(null);
    setLocalLockChannel(null);
    try {
      await axios.post(`${apiBaseUrl}/invoices/${inv._id}/reset-payment-lock`);
      toast.success("Verification cleared — you can try again");
      router.invalidate();
    } catch (e) {
      console.error("Failed to clear verification lock:", e);
      toast.error("Could not clear verification. Please refresh and try again.");
    }
  }, [apiBaseUrl, inv?._id, router]);

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
    { id: "6", type: "paid" as const, date: new Date().toISOString(), title: "Paid", desc: "Payment received via Razorpay." }
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
    paymentLinkQrUrl,
    tax,
    total,
    downloadPDF,
    initiateOnlinePayment,
    openPaymentLink,
    resetPaymentLock,
    displayEvents,
  };
}
