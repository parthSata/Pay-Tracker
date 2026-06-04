import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Invoice } from "../models/invoice.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { logActivity } from "../utils/logger.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import emailValidator from "deep-email-validator";

import Razorpay from "razorpay";
import { ActivityLog } from "../models/activityLog.model.js";

let razorpay;
const getRazorpayInstance = () => {
    if (!razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret || keyId === "your_client_id" || keyId.startsWith("your_")) {
            console.warn("Razorpay API keys are missing or invalid. Skipping link generation.");
            return null;
        }
        razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpay;
};

// Verification lock window: after a payer clicks "Pay via Razorpay", we treat the
// invoice as "verifying" for this duration to prevent duplicate payments — even if
// the payer never returns to the app or reloads the tab.
const PAYMENT_LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const isPaymentLocked = (invoice) => {
    if (!invoice?.paymentInitiatedAt || invoice.status === "PAID") return false;
    const elapsed = Date.now() - new Date(invoice.paymentInitiatedAt).getTime();
    return elapsed >= 0 && elapsed < PAYMENT_LOCK_WINDOW_MS;
};

const isUnpaidInvoice = (invoice) => invoice && invoice.status !== "PAID";

const formatINR = (amount) => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
};

const getInvoiceUserId = (invoice) => invoice?.userId?._id || invoice?.userId;

const formatPaymentMethod = (method) => {
    if (!method) return "Payment";
    return String(method).replace(/_/g, " ").toUpperCase();
};

const setPaidPaymentMethod = (invoice, method = "RAZORPAY") => {
    const normalized = String(method || "").toUpperCase();
    invoice.paymentMethod = ["UPI", "MANUAL"].includes(normalized) ? normalized : "RAZORPAY";
};

const normalizeAuditMethod = (method = "RAZORPAY") => {
    const normalized = String(method || "RAZORPAY").toUpperCase();
    if (normalized === "UPI") return "UPI";
    if (normalized === "CARD") return "CARD";
    if (normalized === "MANUAL") return "MANUAL";
    if (normalized === "NETBANKING") return "NETBANKING";
    if (normalized === "WALLET") return "WALLET";
    return "RAZORPAY";
};

const getAttemptAmount = (invoice) => invoice?.totalAmount || invoice?.amount || 0;

const getNextAttemptNumber = (invoice) => ((invoice.paymentAttempts || []).length + 1);

const findActivePaymentAttempt = (invoice, method) => {
    const normalizedMethod = normalizeAuditMethod(method);
    return [...(invoice.paymentAttempts || [])]
        .reverse()
        .find((attempt) => attempt.status === "STARTED" && attempt.method === normalizedMethod);
};

const recordPaymentStarted = (invoice, { method = "RAZORPAY", gateway = null, source = "payment-started" } = {}) => {
    if (!invoice) return null;
    invoice.paymentAttempts = invoice.paymentAttempts || [];
    const activeAttempt = findActivePaymentAttempt(invoice, method);
    if (activeAttempt) return activeAttempt;

    const attempt = {
        attemptNumber: getNextAttemptNumber(invoice),
        attemptedAt: new Date(),
        method: normalizeAuditMethod(method),
        status: "STARTED",
        amount: getAttemptAmount(invoice),
        gateway,
        source,
    };
    invoice.paymentAttempts.push(attempt);
    return attempt;
};

const findPaymentAttemptForOutcome = (invoice, { method = "RAZORPAY", gatewayPaymentId = null } = {}) => {
    const attempts = invoice.paymentAttempts || [];
    if (gatewayPaymentId) {
        const byGatewayId = attempts.find((attempt) => attempt.gatewayPaymentId === gatewayPaymentId);
        if (byGatewayId) return byGatewayId;
    }
    return findActivePaymentAttempt(invoice, method);
};

const recordPaymentSuccess = (invoice, {
    method = "RAZORPAY",
    gateway = null,
    gatewayPaymentId = null,
    source = "payment-success",
} = {}) => {
    if (!invoice) return null;
    invoice.paymentAttempts = invoice.paymentAttempts || [];
    const existingSuccess = gatewayPaymentId
        ? invoice.paymentAttempts.find((attempt) => attempt.gatewayPaymentId === gatewayPaymentId && attempt.status === "SUCCESS")
        : invoice.paymentAttempts.find((attempt) => attempt.status === "SUCCESS");
    if (existingSuccess) return existingSuccess;

    let attempt = findPaymentAttemptForOutcome(invoice, { method, gatewayPaymentId });
    if (!attempt) {
        attempt = {
            attemptNumber: getNextAttemptNumber(invoice),
            attemptedAt: new Date(invoice.paidAt || Date.now()),
            amount: getAttemptAmount(invoice),
        };
        invoice.paymentAttempts.push(attempt);
    }

    attempt.method = normalizeAuditMethod(method);
    attempt.status = "SUCCESS";
    attempt.amount = attempt.amount || getAttemptAmount(invoice);
    attempt.gateway = gateway || attempt.gateway;
    attempt.gatewayPaymentId = gatewayPaymentId || attempt.gatewayPaymentId;
    attempt.source = source;
    attempt.failureReason = undefined;
    attempt.failureCode = undefined;
    return attempt;
};

const recordPaymentFailure = (invoice, {
    method = "RAZORPAY",
    gateway = "RAZORPAY",
    gatewayPaymentId = null,
    failureReason = "Payment could not be completed",
    failureCode = null,
    source = "payment-failure",
} = {}) => {
    if (!invoice) return null;
    invoice.paymentAttempts = invoice.paymentAttempts || [];

    let attempt = findPaymentAttemptForOutcome(invoice, { method, gatewayPaymentId });
    if (!attempt) {
        attempt = {
            attemptNumber: getNextAttemptNumber(invoice),
            attemptedAt: new Date(),
            amount: getAttemptAmount(invoice),
        };
        invoice.paymentAttempts.push(attempt);
    }

    attempt.method = normalizeAuditMethod(method);
    attempt.status = "FAILED";
    attempt.amount = attempt.amount || getAttemptAmount(invoice);
    attempt.gateway = gateway || attempt.gateway;
    attempt.gatewayPaymentId = gatewayPaymentId || attempt.gatewayPaymentId;
    attempt.failureReason = failureReason;
    attempt.failureCode = failureCode;
    attempt.source = source;
    return attempt;
};

const recordPaymentReset = (invoice, source = "payment-lock-reset") => {
    if (!invoice) return null;
    invoice.paymentAttempts = invoice.paymentAttempts || [];
    const activeAttempt = [...invoice.paymentAttempts].reverse().find((attempt) => attempt.status === "STARTED");
    const method = activeAttempt?.method || invoice.paymentInitiatedChannel || invoice.paymentMethod || "RAZORPAY";
    const attempt = {
        attemptNumber: getNextAttemptNumber(invoice),
        attemptedAt: new Date(),
        method: normalizeAuditMethod(method),
        status: "RESET",
        amount: getAttemptAmount(invoice),
        gateway: activeAttempt?.gateway,
        source,
    };
    invoice.paymentAttempts.push(attempt);
    return attempt;
};

const buildPaymentAudit = (invoice, { includeSensitive = false } = {}) => {
    const attempts = (invoice?.paymentAttempts || []).map((attempt) => {
        const base = {
            id: attempt._id?.toString(),
            attemptNumber: attempt.attemptNumber,
            attemptedAt: attempt.attemptedAt,
            method: attempt.method,
            status: attempt.status,
            amount: attempt.amount,
            gateway: attempt.gateway,
            failureReason: attempt.failureReason,
            failureCode: attempt.failureCode,
            source: attempt.source,
        };
        if (includeSensitive) {
            base.gatewayPaymentId = attempt.gatewayPaymentId;
        }
        return base;
    });
    if (attempts.length === 0 && invoice?.status === "PAID") {
        attempts.push({
            id: "legacy-paid",
            attemptNumber: 1,
            attemptedAt: invoice.paidAt || invoice.updatedAt || invoice.createdAt,
            method: invoice.paymentMethod || "MANUAL",
            status: "SUCCESS",
            amount: getAttemptAmount(invoice),
            gateway: invoice.paymentMethod || "MANUAL",
            source: "legacy-paid-invoice",
        });
    }
    const failedAttempts = attempts.filter((attempt) => attempt.status === "FAILED").length;

    return {
        status: invoice?.status,
        method: invoice?.paymentMethod,
        paidAt: invoice?.paidAt,
        retryCount: failedAttempts,
        refundStatus: invoice?.refundStatus || "NOT_REQUESTED",
        refundUpdatedAt: invoice?.refundUpdatedAt,
        ...(includeSensitive ? {
            refundReference: invoice?.refundReference,
            refundReason: invoice?.refundReason,
        } : {}),
        attempts,
    };
};

const buildPaymentConfirmationEmail = ({
    headline,
    invoice,
    merchantName,
    amount,
    paidAt,
    paymentMethod,
}) => `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 12px; color: #111827;">${headline}</h2>
        <p style="margin: 0 0 18px; color: #4b5563;">Payment confirmation from Pay Tracker.</p>
        <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 10px; overflow: hidden;">
            <tr>
                <td style="padding: 10px 12px; color: #6b7280;">Invoice</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #6b7280;">Amount</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${amount}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #6b7280;">Payer</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${invoice.clientName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #6b7280;">Merchant</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${merchantName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #6b7280;">Method</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${paymentMethod}</td>
            </tr>
            <tr>
                <td style="padding: 10px 12px; color: #6b7280;">Paid on</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${paidAt}</td>
            </tr>
        </table>
    </div>
`;

const sendPaymentConfirmation = async (invoice, source = "payment") => {
    if (!invoice || invoice.status !== "PAID") return;

    const merchantId = getInvoiceUserId(invoice);
    const merchant = await User.findById(merchantId).select("name email businessName");
    if (!merchant) {
        console.error(`[Payment Confirmation] Merchant not found for invoice ${invoice.invoiceNumber}`);
        return;
    }

    const paymentConfirmation = invoice.paymentConfirmation || {};
    const amount = formatINR(invoice.totalAmount || invoice.amount);
    const merchantName = merchant.businessName || merchant.name || "Merchant";
    const paidAt = new Date(invoice.paidAt || Date.now()).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
    const paymentMethod = formatPaymentMethod(invoice.paymentMethod);
    const merchantHeadline = `${amount} received successfully from ${invoice.clientName}`;
    const payerHeadline = `Your payment of ${amount} to ${merchantName} was received successfully`;

    if (!paymentConfirmation.inAppMerchantSentAt) {
        try {
            await Notification.create({
                userId: merchant._id,
                title: "Payment Received",
                description: merchantHeadline,
                type: "success",
                category: "payment",
            });
            paymentConfirmation.inAppMerchantSentAt = new Date();
        } catch (err) {
            console.error("[Payment Confirmation] Merchant in-app notification failed:", err.message);
        }
    }

    if (!paymentConfirmation.inAppPayerSentAt) {
        try {
            const payerUser = await User.findOne({ email: invoice.clientEmail.toLowerCase().trim() }).select("_id");
            if (payerUser) {
                await Notification.create({
                    userId: payerUser._id,
                    title: "Payment Receipt",
                    description: payerHeadline,
                    type: "success",
                    category: "payment",
                });
                paymentConfirmation.inAppPayerSentAt = new Date();
            }
        } catch (err) {
            console.error("[Payment Confirmation] Payer in-app notification failed:", err.message);
        }
    }

    if (!paymentConfirmation.emailMerchantSentAt) {
        const sent = await sendEmail(
            merchant.email,
            `Payment received for ${invoice.invoiceNumber}`,
            buildPaymentConfirmationEmail({
                headline: merchantHeadline,
                invoice,
                merchantName,
                amount,
                paidAt,
                paymentMethod,
            })
        );
        if (sent) {
            paymentConfirmation.emailMerchantSentAt = new Date();
        } else {
            console.error(`[Payment Confirmation] Merchant email failed for ${invoice.invoiceNumber} via ${source}`);
        }
    }

    if (!paymentConfirmation.emailPayerSentAt) {
        const sent = await sendEmail(
            invoice.clientEmail,
            `Payment receipt for ${invoice.invoiceNumber}`,
            buildPaymentConfirmationEmail({
                headline: payerHeadline,
                invoice,
                merchantName,
                amount,
                paidAt,
                paymentMethod,
            })
        );
        if (sent) {
            paymentConfirmation.emailPayerSentAt = new Date();
        } else {
            console.error(`[Payment Confirmation] Payer email failed for ${invoice.invoiceNumber} via ${source}`);
        }
    }

    invoice.paymentConfirmation = paymentConfirmation;
    invoice.markModified("paymentConfirmation");
    await invoice.save();
};

const paymentBelongsToInvoice = (payment, invoice) => {
    if (!payment || !invoice) return false;

    const notes = payment.notes || {};
    const invoiceId = invoice._id?.toString();
    const invoiceNumber = invoice.invoiceNumber;

    return (
        payment.payment_link_id === invoice.razorpayLinkId ||
        payment.qr_code_id === invoice.razorpayQrCodeId ||
        payment.link_id === invoice.razorpayLinkId ||
        notes.invoice_id === invoiceId ||
        notes.invoiceId === invoiceId ||
        notes.invoice_number === invoiceNumber ||
        notes.invoiceNumber === invoiceNumber ||
        payment.description?.includes(invoiceNumber)
    );
};

const normalizeRazorpayPayments = (result) => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.items)) return result.items;
    return [];
};

const fetchRecentPaymentAttempts = async (razorpayInstance, invoice) => {
    if (!razorpayInstance || !invoice?.razorpayLinkId) return [];

    const initiatedAt = invoice.paymentInitiatedAt
        ? new Date(invoice.paymentInitiatedAt).getTime()
        : Date.now() - PAYMENT_LOCK_WINDOW_MS;
    const from = Math.max(0, Math.floor((initiatedAt - 5 * 1000) / 1000));

    try {
        const result = await razorpayInstance.payments.all({
            from,
            count: 25,
        });

        return normalizeRazorpayPayments(result).filter((payment) =>
            paymentBelongsToInvoice(payment, invoice)
        );
    } catch (error) {
        console.error(`Failed to fetch Razorpay payment attempts for ${invoice.invoiceNumber}:`, error?.message || error);
        return [];
    }
};

const findInvoiceFromRazorpayPayload = async (razorpayLinkId, paymentEntity) => {
    if (razorpayLinkId) {
        const invoice = await Invoice.findOne({ razorpayLinkId });
        if (invoice) return invoice;
    }

    const notes = paymentEntity?.notes || {};
    const qrCodeId = paymentEntity?.qr_code_id;
    if (qrCodeId) {
        const invoice = await Invoice.findOne({ razorpayQrCodeId: qrCodeId });
        if (invoice) return invoice;
    }

    const invoiceId = notes.invoice_id || notes.invoiceId;
    if (invoiceId && mongoose.Types.ObjectId.isValid(invoiceId)) {
        const invoice = await Invoice.findById(invoiceId);
        if (invoice) return invoice;
    }

    const invoiceNumber = notes.invoice_number || notes.invoiceNumber;
    if (invoiceNumber) {
        return Invoice.findOne({ invoiceNumber });
    }

    return null;
};

const persistPaymentFailure = async (invoice, reason, code, source = "Razorpay", attemptMeta = {}) => {
    if (!invoice || invoice.status === "PAID") return false;

    invoice.lastPaymentFailureAt = new Date();
    invoice.lastPaymentFailureReason = reason || "Payment could not be completed";
    invoice.lastPaymentFailureCode = code || null;
    recordPaymentFailure(invoice, {
        method: attemptMeta.method || invoice.paymentInitiatedChannel || "RAZORPAY",
        gateway: attemptMeta.gateway || "RAZORPAY",
        gatewayPaymentId: attemptMeta.gatewayPaymentId,
        failureReason: invoice.lastPaymentFailureReason,
        failureCode: invoice.lastPaymentFailureCode,
        source,
    });
    // Release the verification lock so the payer can immediately retry.
    invoice.paymentInitiatedAt = undefined;
    invoice.paymentInitiatedChannel = undefined;
    invoice.history.push({
        action: "PAYMENT_FAILED",
        details: `${source} payment failed: ${invoice.lastPaymentFailureReason}${invoice.lastPaymentFailureCode ? ` (${invoice.lastPaymentFailureCode})` : ""}`
    });
    await invoice.save();
    return true;
};

/**
 * Inspect a Razorpay paymentLink's `payments[]` array and decide whether the most
 * recent attempt (since the verification lock engaged) has failed. We never mark
 * "failed" if a successful attempt exists — payments can have multiple attempts
 * before one succeeds, and the success is what matters.
 *
 * Returns { failed, reason, code } where `failed === true` means the UI should
 * exit the verifying state and prompt the payer to retry.
 */
const evaluateRazorpayFailure = (plink, paymentInitiatedAt) => {
    const payments = Array.isArray(plink) ? plink : plink?.payments;
    if (!Array.isArray(payments) || payments.length === 0) {
        return { failed: false, reason: null, code: null };
    }
    const initiatedMs = paymentInitiatedAt ? new Date(paymentInitiatedAt).getTime() : 0;
    // Razorpay returns `created_at` as unix seconds.
    const relevant = payments.filter((p) => {
        const createdMs = (p?.created_at || 0) * 1000;
        // 5s grace window covers clock-skew between client → server → Razorpay.
        return createdMs >= initiatedMs - 5000;
    });
    if (relevant.length === 0) return { failed: false, reason: null, code: null };

    const hasSuccess = relevant.some((p) => p.status === "captured" || p.status === "authorized");
    if (hasSuccess) return { failed: false, reason: null, code: null };

    const latestFailed = relevant
        .filter((p) => p.status === "failed")
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))[0];
    if (!latestFailed) return { failed: false, reason: null, code: null };

    return {
        failed: true,
        reason: latestFailed.error_description || latestFailed.error_reason || "Payment could not be completed",
        code: latestFailed.error_code || null,
        method: latestFailed.method,
        gatewayPaymentId: latestFailed.id,
    };
};

const buildRazorpayPaymentLinkPayload = ({ invoice, frontendUrl }) => {
    const dueMs = new Date(invoice.dueDate).getTime();
    const sixtyDaysFromNow = Date.now() + 60 * 24 * 60 * 60 * 1000;
    const expireBy = Math.floor(Math.max(dueMs + 30 * 24 * 60 * 60 * 1000, sixtyDaysFromNow) / 1000);

    return {
        amount: Math.round((invoice.totalAmount || invoice.amount || 0) * 100),
        currency: "INR",
        upi_link: true,
        accept_partial: false,
        description: `Invoice ${invoice.invoiceNumber} for ${invoice.clientName}`,
        customer: {
            name: invoice.clientName,
            email: invoice.clientEmail,
        },
        notify: {
            sms: false,
            email: false,
        },
        reminder_enable: true,
        expire_by: expireBy,
        reference_id: invoice._id.toString(),
        notes: {
            invoice_id: invoice._id.toString(),
            invoice_number: invoice.invoiceNumber,
        },
        callback_url: `${frontendUrl}/pay/${invoice._id}`,
        callback_method: "get",
    };
};

const buildRazorpayOrderPayload = (invoice) => ({
    amount: Math.round((invoice.totalAmount || invoice.amount || 0) * 100),
    currency: "INR",
    receipt: invoice._id.toString(),
    notes: {
        invoice_id: invoice._id.toString(),
        invoice_number: invoice.invoiceNumber,
    },
});

/**
 * Cancel the Razorpay payment link so the URL can no longer accept payments.
 * This is critical after a successful payment to prevent the payer from accidentally
 * paying twice via a stale link/bookmark/email.
 * Silently no-ops if Razorpay is not configured or the link cannot be cancelled
 * (e.g., already cancelled/paid — Razorpay treats those as terminal states).
 */
const cancelRazorpayLinkSafe = async (razorpayLinkId) => {
    if (!razorpayLinkId) return;
    const instance = getRazorpayInstance();
    if (!instance) return;
    try {
        await instance.paymentLink.cancel(razorpayLinkId);
    } catch (error) {
        // Razorpay returns BAD_REQUEST when the link is already in a terminal state — that's fine.
        const code = error?.statusCode || error?.error?.code;
        if (code !== 400 && code !== "BAD_REQUEST_ERROR") {
            console.error(`Failed to cancel Razorpay link ${razorpayLinkId}:`, error?.error?.description || error?.message || error);
        }
    }
};

const ensureRazorpayUpiPaymentLink = async (invoice, frontendUrl, { force = false } = {}) => {
    if (!isUnpaidInvoice(invoice) || (!force && invoice.razorpayUpiLinkEnabled)) return false;
    const instance = getRazorpayInstance();
    if (!instance) return false;

    try {
        const oldLinkId = invoice.razorpayLinkId;
        const response = await instance.paymentLink.create(buildRazorpayPaymentLinkPayload({
            invoice,
            frontendUrl,
        }));

        invoice.paymentLink = response.short_url;
        invoice.razorpayLinkId = response.id;
        invoice.razorpayUpiEnabled = true;
        invoice.razorpayUpiLinkEnabled = true;
        invoice.history.push({
            action: "RAZORPAY_LINK_REFRESHED",
            details: force
                ? "Created a fresh Razorpay UPI payment link before checkout"
                : "Upgraded Razorpay payment link to UPI mode"
        });
        await invoice.save();

        if (oldLinkId && oldLinkId !== response.id) {
            await cancelRazorpayLinkSafe(oldLinkId);
        }
        return true;
    } catch (error) {
        console.error(`Failed to upgrade Razorpay link for ${invoice.invoiceNumber}:`, error?.error?.description || error?.message || error);
        return false;
    }
};

const closeRazorpayQrSafe = async (razorpayQrCodeId) => {
    if (!razorpayQrCodeId) return;
    const instance = getRazorpayInstance();
    if (!instance) return;
    try {
        await instance.qrCode.close(razorpayQrCodeId);
    } catch (error) {
        const code = error?.statusCode || error?.error?.code;
        if (code !== 400 && code !== "BAD_REQUEST_ERROR") {
            console.error(`Failed to close Razorpay QR ${razorpayQrCodeId}:`, error?.error?.description || error?.message || error);
        }
    }
};

const markInvoicePaidFromRazorpayQr = async (invoice, payment, source = "razorpay-qr-sync") => {
    invoice.status = "PAID";
    invoice.paidAt = new Date((payment?.created_at || Math.floor(Date.now() / 1000)) * 1000);
    setPaidPaymentMethod(invoice, "UPI");
    recordPaymentSuccess(invoice, {
        method: "UPI",
        gateway: "RAZORPAY_QR",
        gatewayPaymentId: payment?.id,
        source,
    });
    invoice.history.push({
        action: "PAID",
        details: "Payment verified via Razorpay QR"
    });
    await invoice.save();
    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
    await closeRazorpayQrSafe(invoice.razorpayQrCodeId);

    await ActivityLog.create({
        userId: getInvoiceUserId(invoice),
        invoiceId: invoice._id,
        action: "PAYMENT_RECEIVED",
        details: `Payment verified via Razorpay QR for ${invoice.invoiceNumber}`
    });

    await sendPaymentConfirmation(invoice, source);
};

const syncRazorpayQrPayment = async (invoice, source = "razorpay-qr-sync") => {
    if (!isUnpaidInvoice(invoice) || !invoice.razorpayQrCodeId) return false;
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) return false;

    try {
        const qrPayments = await razorpayInstance.qrCode.fetchAllPayments(invoice.razorpayQrCodeId, { count: 10 });
        const successfulQrPayment = (qrPayments?.items || []).find((payment) =>
            payment.status === "captured" || payment.status === "authorized"
        );
        if (!successfulQrPayment) return false;

        await markInvoicePaidFromRazorpayQr(invoice, successfulQrPayment, source);
        return true;
    } catch (error) {
        console.error(`Failed to sync Razorpay QR for ${invoice.invoiceNumber}:`, error?.message || error);
        return false;
    }
};

const createInvoice = asyncHandler(async (req, res) => {
    const { clientName, clientEmail, amount, dueDate, paymentMethod, clientState, gstRate: manualGstRate, notes } = req.body;

    if (
        [clientName, clientEmail, amount, dueDate].some((field) =>
            field === undefined || field === null || (typeof field === "string" && field.trim() === "")
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.plan === "FREE") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const count = await Invoice.countDocuments({
            userId: req.user?._id,
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        if (count >= 10) {
            throw new ApiError(403, "Invoice limit reached for the Free Plan (max 10 invoices/month). Please upgrade to the Paid Plan for unlimited invoices.");
        }
    }

    if (clientEmail.toLowerCase() === user.email.toLowerCase()) {
        throw new ApiError(400, "You cannot send an invoice to your own email address");
    }

    // Verify if the client email actually exists (MX records and Syntax)
    try {
        const { valid, reason, validators } = await emailValidator({
            email: clientEmail,
            validateSMTP: false,
            validateTypo: false,
            validateDisposable: false,
        });

        if (!valid) {
            const validatorInfo = validators[reason];
            const reasonMsg = String(validatorInfo?.reason || "Invalid or non-existent email address");

            // Bypass mx/smtp checks if they fail due to network/system errors (like AggregateError or DNS timeouts)
            const isNetworkError = reasonMsg.includes("AggregateError") ||
                reasonMsg.includes("ECONN") ||
                reasonMsg.includes("ETIMEOUT") ||
                (reasonMsg.includes("ENOTFOUND") && reasonMsg !== "MX record not found");

            if (reason === "smtp" || (reason === "mx" && isNetworkError)) {
                console.warn(`[Email Validator] Warning: '${reason}' check failed for ${clientEmail} with message: '${reasonMsg}'. Bypassing error to prevent network block.`);
            } else {
                throw new ApiError(400, `Client email validation failed: ${reasonMsg}`);
            }
        }
    } catch (err) {
        if (err instanceof ApiError) throw err;
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
        throw new ApiError(400, "Amount must be a positive number");
    }

    const manualGst = manualGstRate === undefined || manualGstRate === null || manualGstRate === ""
        ? undefined
        : Number(manualGstRate);
    let gstRate =
        manualGst !== undefined && Number.isFinite(manualGst)
            ? manualGst
            : user.gstEnabled
                ? Number(user.defaultGstRate ?? 0)
                : 0;
    if (!Number.isFinite(gstRate) || gstRate < 0) {
        gstRate = 0;
    }

    let gstAmount = 0;
    let cgst = 0, sgst = 0, igst = 0;
    let taxType = "NONE";

    if (user.gstEnabled || (manualGst !== undefined && manualGst > 0)) {
        gstAmount = (amountNum * gstRate) / 100;
        if (user.businessState === (clientState || user.businessState)) {
            taxType = "CGST_SGST";
            cgst = gstAmount / 2;
            sgst = gstAmount / 2;
        } else {
            taxType = "IGST";
            igst = gstAmount;
        }
    }

    const totalAmount = amountNum + gstAmount;

    // Generate unique invoice number: INV-YEAR-RANDOM
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${year}-${random}`;

    // Generate public access token
    const token = crypto.randomBytes(32).toString("hex");

    // Pre-generate MongoDB ObjectId to supply to Razorpay callback URL
    const invoiceId = new mongoose.Types.ObjectId();
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:5173";

    // Generate Razorpay Payment Link
    let paymentLink = "";
    let razorpayLinkId;
    const razorpayInstance = getRazorpayInstance();
    if (razorpayInstance) {
        try {
            // Razorpay accepts expire_by as a unix-second timestamp; min 15min, max 1yr.
            // We expire 30 days after the invoice due date (or 60 days from now, whichever is later)
            // so stale links can't accept payments after the invoice cycle has wrapped up.
            const dueMs = new Date(dueDate).getTime();
            const sixtyDaysFromNow = Date.now() + 60 * 24 * 60 * 60 * 1000;
            const expireBy = Math.floor(Math.max(dueMs + 30 * 24 * 60 * 60 * 1000, sixtyDaysFromNow) / 1000);

            const razorpayResponse = await razorpayInstance.paymentLink.create({
                amount: Math.round(totalAmount * 100), // amount in paise, inclusive of GST
                currency: "INR",
                upi_link: true,
                accept_partial: false,
                description: `Invoice ${invoiceNumber} for ${clientName}`,
                customer: {
                    name: clientName,
                    email: clientEmail,
                },
                notify: {
                    sms: false,
                    email: false,
                },
                reminder_enable: true,
                expire_by: expireBy,
                reference_id: invoiceId.toString(),
                notes: {
                    invoice_id: invoiceId.toString(),
                    invoice_number: invoiceNumber,
                },
                callback_url: `${frontendUrl}/pay/${invoiceId}`,
                callback_method: "get"
            });
            paymentLink = razorpayResponse.short_url;
            razorpayLinkId = razorpayResponse.id;
        } catch (error) {
            console.error("Razorpay Error:", error);
        }
    }

    const invoice = await Invoice.create({
        _id: invoiceId,
        userId: req.user?._id,
        clientName,
        clientEmail,
        clientState: clientState || user.businessState,
        amount: amountNum, // taxable value
        gstRate,
        gstAmount,
        cgst,
        sgst,
        igst,
        taxType,
        totalAmount,
        dueDate,
        invoiceNumber,
        token,
        paymentLink,
        razorpayLinkId,
        razorpayUpiEnabled: !!paymentLink,
        razorpayUpiLinkEnabled: !!paymentLink,
        paymentMethod: paymentMethod || "RAZORPAY",
        status: "PENDING",
        notes,
        history: [{
            action: "CREATED",
            details: `Invoice created with number ${invoiceNumber}`
        }]
    });

    if (!invoice) {
        throw new ApiError(500, "Something went wrong while creating the invoice");
    }

    // Send invoice email. Payments go through Razorpay so UPI, cards, netbanking,
    // and wallets all share the same gateway verification path.
    const totalWithTax = totalAmount;

    const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6366f1; margin: 0;">Pay Tracker</h1>
                <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Modern Invoicing Solution</p>
            </div>
            <h2 style="color: #111827; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Invoice from ${req.user?.businessName || req.user?.name}</h2>
            <p>Hi ${clientName},</p>
            <p>You have a new invoice <strong>${invoiceNumber}</strong> for professional services.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #374151;">Amount Due: <strong style="font-size: 18px;">₹${totalWithTax.toFixed(2)}</strong></p>
                <p style="margin: 5px 0; color: #374151;">Due Date: <strong>${new Date(dueDate).toLocaleDateString()}</strong></p>
            </div>
            ${notes ? `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #374151;"><strong>Notes:</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">${notes}</p>
            </div>
            ` : ''}
            ${paymentLink ? `
            <p>Pay securely via Razorpay. You can use UPI, cards, netbanking, or wallets from the payment page:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${paymentLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Pay via Razorpay</a>
            </div>
            ` : `
            <p>Please open your Pay Tracker invoice link to complete this payment.</p>
            `}
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
                Sent by ${req.user?.businessName || req.user?.name} via Pay Tracker.<br>
                For any queries, please contact <a href="mailto:${req.user?.email}" style="color: #6366f1;">${req.user?.email}</a>
            </p>
        </div>
    `;

    // Send email asynchronously
    sendEmail(
        clientEmail,
        `Invoice ${invoiceNumber} from ${req.user?.businessName || req.user?.name}`,
        emailHtml
    ).catch(err => console.error("Email sending failed:", err));

    await logActivity({
        userId: req.user._id,
        invoiceId: invoice._id,
        action: "INVOICE_CREATED",
        details: `Created invoice ${invoiceNumber} for ${clientName}`,
    });

    const clientUser = await User.findOne({ email: clientEmail.toLowerCase().trim() });
    if (clientUser) {
        try {
            await Notification.create({
                userId: clientUser._id,
                title: "New Invoice Received",
                description: `${req.user?.businessName || req.user?.name} sent you a new invoice ${invoiceNumber} for ₹${totalAmount}`,
                type: "info",
                category: "invoice",
            });
        } catch (e) {
            console.error("Optional client notification failed:", e.message);
        }
    }

    return res.status(201).json(
        new ApiResponse(201, invoice, "Invoice created successfully and email sent")
    );
});

const getInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ userId: req.user?._id }).sort({ createdAt: -1 });

    // For each pending invoice with a Razorpay link, check its status
    const razorpayInstance = getRazorpayInstance();
    if (razorpayInstance) {
        for (let i = 0; i < invoices.length; i++) {
            if (isUnpaidInvoice(invoices[i]) && invoices[i].razorpayLinkId) {
                try {
                    const plink = await razorpayInstance.paymentLink.fetch(invoices[i].razorpayLinkId);
                    if (plink.status === "paid") {
                        invoices[i].status = "PAID";
                        invoices[i].paidAt = new Date();
                        setPaidPaymentMethod(invoices[i], "RAZORPAY");
                        recordPaymentSuccess(invoices[i], {
                            method: "RAZORPAY",
                            gateway: "RAZORPAY",
                            source: "invoice-list-sync",
                        });
                        await invoices[i].save();
                        // Invalidate the link so the same URL can't be used to pay again.
                        await cancelRazorpayLinkSafe(invoices[i].razorpayLinkId);
                        await closeRazorpayQrSafe(invoices[i].razorpayQrCodeId);

                        await ActivityLog.create({
                            userId: invoices[i].userId,
                            invoiceId: invoices[i]._id,
                            action: "PAYMENT_RECEIVED",
                            details: `Payment received via Razorpay for ${invoices[i].invoiceNumber}`
                        });

                        await sendPaymentConfirmation(invoices[i], "invoice-list-sync");
                    }
                } catch (error) {
                    console.error(`Failed to fetch status for ${invoices[i].invoiceNumber}:`, error);
                }
            }

            if (isUnpaidInvoice(invoices[i]) && invoices[i].razorpayQrCodeId) {
                await syncRazorpayQrPayment(invoices[i], "invoice-list-qr-sync");
            }
        }
    }

    const invoicePayloads = invoices.map((invoice) => {
        const data = invoice.toObject();
        data.paymentAudit = buildPaymentAudit(invoice, { includeSensitive: true });
        delete data.paymentAttempts;
        return data;
    });

    return res.status(200).json(
        new ApiResponse(200, invoicePayloads, "Invoices fetched successfully")
    );
});

const getInvoiceById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // For public access, we don't check userId. 
    // We populate the 'userId' field which contains the SME/Merchant info.
    const invoice = await Invoice.findById(id).populate("userId", "name email businessName upiId gstNumber businessState gstEnabled profilePic logoUrl watermarkEnabled watermarkOpacity brandTemplate brandColor brandTextColor footerText signatureType signatureUrl signatureText signatureFont bankDetails");

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:5173";

    // Check Razorpay status if pending
    if (isUnpaidInvoice(invoice) && invoice.razorpayLinkId) {
        const razorpayInstance = getRazorpayInstance();
        if (razorpayInstance) {
            try {
                const plink = await razorpayInstance.paymentLink.fetch(invoice.razorpayLinkId);
                if (plink.status === "paid") {
                    invoice.status = "PAID";
                    invoice.paidAt = new Date();
                    setPaidPaymentMethod(invoice, "RAZORPAY");
                    recordPaymentSuccess(invoice, {
                        method: "RAZORPAY",
                        gateway: "RAZORPAY",
                        source: "invoice-public-fetch",
                    });
                    await invoice.save();
                    // Invalidate the link so the same URL can't be used to pay again.
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                    await closeRazorpayQrSafe(invoice.razorpayQrCodeId);

                    await ActivityLog.create({
                        userId: invoice.userId._id,
                        invoiceId: invoice._id,
                        action: "PAYMENT_RECEIVED",
                        details: `Payment received via Razorpay for ${invoice.invoiceNumber}`
                    });

                    await sendPaymentConfirmation(invoice, "invoice-public-fetch");
                }
            } catch (error) {
                console.error(`Failed to fetch status for ${invoice.invoiceNumber}:`, error);
            }
        }
    }

    if (isUnpaidInvoice(invoice)) {
        await ensureRazorpayUpiPaymentLink(invoice, frontendUrl);
    }

    if (isUnpaidInvoice(invoice) && invoice.razorpayQrCodeId) {
        await syncRazorpayQrPayment(invoice, "invoice-public-qr-sync");
    }

    // Transform userId to 'sme' for the frontend
    const invoiceData = invoice.toObject();
    const isOwner = req.user?._id?.toString() === invoice.userId?._id?.toString();
    invoiceData.paymentAudit = buildPaymentAudit(invoice, { includeSensitive: isOwner });
    delete invoiceData.paymentAttempts;
    delete invoiceData.refundReference;
    delete invoiceData.refundReason;
    invoiceData.sme = invoiceData.userId;
    delete invoiceData.userId;

    // Expose verification-lock state to the public payer view.
    // The frontend uses these to render the "Verifying your payment..." UI and hide
    // duplicate payment options, even across page reloads or fresh tabs.
    invoiceData.isPaymentLocked = isPaymentLocked(invoice);
    invoiceData.paymentLockWindowMs = PAYMENT_LOCK_WINDOW_MS;
    invoiceData.paymentInitiatedChannel = invoice.paymentInitiatedChannel;
    // Only surface failure metadata when the failure is fresh AND not already paid.
    // A failure older than the lock window is stale (e.g., the payer already retried
    // successfully or moved on) and shouldn't clutter the UI.
    const failureFresh =
        invoice.lastPaymentFailureAt &&
        invoice.status !== "PAID" &&
        Date.now() - new Date(invoice.lastPaymentFailureAt).getTime() < PAYMENT_LOCK_WINDOW_MS;
    if (failureFresh) {
        invoiceData.lastPaymentFailureAt = invoice.lastPaymentFailureAt;
        invoiceData.lastPaymentFailureReason = invoice.lastPaymentFailureReason;
        invoiceData.lastPaymentFailureCode = invoice.lastPaymentFailureCode;
    }

    // Log viewed event if not already viewed in the last 24 hours (prevents duplicates)
    // We only log if it's not the owner
    if (!req.user || req.user._id.toString() !== invoice.userId._id.toString()) {
        const lastViewEvent = invoice.history
            .filter(h => h.action === "VIEWED")
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (!lastViewEvent || lastViewEvent.timestamp < oneDayAgo) {
            invoice.history.push({
                action: "VIEWED",
                details: `Invoice viewed by ${req.user ? req.user.name : "Public User"}`
            });
            await invoice.save();

            try {
                await Notification.create({
                    userId: invoice.userId._id,
                    title: "Invoice Viewed",
                    description: `Invoice ${invoice.invoiceNumber} was viewed by ${req.user ? req.user.name : "the client"}.`,
                    type: "info",
                    category: "viewed"
                });
            } catch (e) {
                console.error("Failed to create viewed notification:", e.message);
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, invoiceData, "Invoice fetched successfully")
    );
});

const searchInvoice = asyncHandler(async (req, res) => {
    const { invoiceNumber, email } = req.query;

    if (!invoiceNumber || !email) {
        throw new ApiError(400, "Invoice number and email are required");
    }

    const invoice = await Invoice.findOne({
        invoiceNumber: invoiceNumber.toUpperCase(),
        clientEmail: email.toLowerCase()
    }).populate("userId", "name email businessName upiId gstNumber businessState gstEnabled profilePic logoUrl watermarkEnabled watermarkOpacity brandTemplate brandColor brandTextColor footerText signatureType signatureUrl signatureText signatureFont bankDetails");

    if (!invoice) {
        throw new ApiError(404, "Invoice not found or email mismatch");
    }

    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:5173";

    // Check Razorpay status if pending
    if (isUnpaidInvoice(invoice) && invoice.razorpayLinkId) {
        const razorpayInstance = getRazorpayInstance();
        if (razorpayInstance) {
            try {
                const plink = await razorpayInstance.paymentLink.fetch(invoice.razorpayLinkId);
                if (plink.status === "paid") {
                    invoice.status = "PAID";
                    invoice.paidAt = new Date();
                    setPaidPaymentMethod(invoice, "RAZORPAY");
                    recordPaymentSuccess(invoice, {
                        method: "RAZORPAY",
                        gateway: "RAZORPAY",
                        source: "invoice-search-sync",
                    });
                    await invoice.save();
                    // Invalidate the link so the same URL can't be used to pay again.
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                    await closeRazorpayQrSafe(invoice.razorpayQrCodeId);
                    await sendPaymentConfirmation(invoice, "invoice-search-sync");
                }
            } catch (error) {
                console.error(`Failed to fetch status for ${invoice.invoiceNumber}:`, error);
            }
        }
    }

    if (isUnpaidInvoice(invoice)) {
        await ensureRazorpayUpiPaymentLink(invoice, frontendUrl);
    }

    if (isUnpaidInvoice(invoice) && invoice.razorpayQrCodeId) {
        await syncRazorpayQrPayment(invoice, "invoice-search-qr-sync");
    }

    const invoiceData = invoice.toObject();
    invoiceData.paymentAudit = buildPaymentAudit(invoice, { includeSensitive: false });
    delete invoiceData.paymentAttempts;
    delete invoiceData.refundReference;
    delete invoiceData.refundReason;

    return res.status(200).json(
        new ApiResponse(200, invoiceData, "Invoice found")
    );
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PENDING", "PAID", "OVERDUE"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const previousStatus = invoice.status;
    invoice.status = status;
    invoice.paidAt = status === "PAID" ? (invoice.paidAt || new Date()) : null;
    if (status === "PAID") {
        setPaidPaymentMethod(invoice, invoice.paymentInitiatedChannel || invoice.paymentMethod || "MANUAL");
        if (previousStatus !== "PAID") {
            recordPaymentSuccess(invoice, {
                method: invoice.paymentMethod || "MANUAL",
                gateway: invoice.paymentMethod === "UPI" ? "UPI" : "MANUAL",
                source: "manual-status-update",
            });
        }
    }
    if (status !== "PAID") {
        invoice.paymentConfirmation = undefined;
    }

    await logActivity({
        userId: invoice.userId,
        invoiceId: invoice._id,
        action: status === "PAID" ? "PAYMENT_RECEIVED" : "STATUS_UPDATED",
        details: `Invoice status updated to ${status}`
    });

    invoice.history.push({
        action: status,
        details: `Invoice marked as ${status.toLowerCase()}`
    });
    await invoice.save();

    if (status === "PAID" && previousStatus !== "PAID") {
        await sendPaymentConfirmation(invoice, "manual-status-update");
    } else if (status === "OVERDUE") {
        try {
            await Notification.create({
                userId: invoice.userId,
                title: "Invoice Overdue",
                description: `Invoice ${invoice.invoiceNumber} has been marked as OVERDUE.`,
                type: "warning",
                category: "overdue"
            });
        } catch (err) {
            console.error("Failed to create status update overdue notification:", err.message);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, invoice, `Invoice marked as ${status.toLowerCase()}`)
    );
});

const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get all invoices for this user
    const invoices = await Invoice.find({ userId });

    const stats = {
        totalRevenue: 0,
        pending: 0,
        overdue: 0,
        cashflow: [] // Array of daily revenue for last 30 days
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Initialize cashflow map
    const cashflowMap = new Map();
    for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        cashflowMap.set(date.toISOString().split('T')[0], 0);
    }

    invoices.forEach(inv => {
        const invTotal = inv.totalAmount || (inv.amount + (inv.gstAmount || 0));
        if (inv.status === "PAID") {
            stats.totalRevenue += invTotal;
            if (inv.paidAt) {
                const paid = inv.paidAt instanceof Date ? inv.paidAt : new Date(inv.paidAt);
                if (!Number.isNaN(paid.getTime()) && paid >= thirtyDaysAgo) {
                    const dateKey = paid.toISOString().split("T")[0];
                    if (cashflowMap.has(dateKey)) {
                        cashflowMap.set(dateKey, cashflowMap.get(dateKey) + invTotal);
                    }
                }
            }
        } else if (inv.status === "PENDING") {
            stats.pending += invTotal;
        } else if (inv.status === "OVERDUE") {
            stats.overdue += invTotal;
        }
    });

    // Convert map to sorted array
    stats.cashflow = Array.from(cashflowMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json(
        new ApiResponse(200, stats, "Dashboard stats fetched successfully")
    );
});

const uploadPaymentProof = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        throw new ApiError(400, "Payment proof file is required");
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    const uploadResult = await uploadInCloudinary(req.file.path);
    if (!uploadResult) {
        throw new ApiError(500, "Failed to upload file to Cloudinary");
    }

    invoice.paymentProof = uploadResult.secure_url;
    invoice.history.push({
        action: "PROOF_UPLOADED",
        details: "Client uploaded payment proof screenshot"
    });
    await invoice.save();

    await logActivity({
        userId: invoice.userId,
        invoiceId: invoice._id,
        action: "PAYMENT_PROOF_UPLOADED",
        details: "Client uploaded payment proof screenshot"
    });

    try {
        await Notification.create({
            userId: invoice.userId,
            title: "Payment Proof Uploaded",
            description: `Client uploaded payment proof for invoice ${invoice.invoiceNumber}.`,
            type: "info",
            category: "payment"
        });
    } catch (err) {
        console.error("Failed to create payment proof notification:", err.message);
    }

    return res.status(200).json(
        new ApiResponse(200, { url: uploadResult.secure_url }, "Payment proof uploaded successfully")
    );
});

const getReceivedInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ clientEmail: req.user.email })
        .populate("userId", "name email businessName upiId gstNumber businessState gstEnabled profilePic logoUrl watermarkEnabled watermarkOpacity brandTemplate brandColor brandTextColor footerText signatureType signatureUrl signatureText signatureFont bankDetails")
        .sort({ createdAt: -1 });

    const invoicePayloads = invoices.map((invoice) => {
        const data = invoice.toObject();
        data.paymentAudit = buildPaymentAudit(invoice, { includeSensitive: false });
        delete data.paymentAttempts;
        delete data.refundReference;
        delete data.refundReason;
        return data;
    });

    return res.status(200).json(
        new ApiResponse(200, invoicePayloads, "Received invoices fetched successfully")
    );
});

const getClientRiskAnalytics = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ userId: req.user._id });

    const clientsMap = {};

    invoices.forEach(inv => {
        const email = inv.clientEmail.toLowerCase().trim();
        if (!clientsMap[email]) {
            clientsMap[email] = {
                clientEmail: email,
                clientName: inv.clientName,
                invoices: []
            };
        }
        clientsMap[email].invoices.push(inv);
        if (!clientsMap[email].latestDate || new Date(inv.createdAt) > new Date(clientsMap[email].latestDate)) {
            clientsMap[email].clientName = inv.clientName;
            clientsMap[email].latestDate = inv.createdAt;
        }
    });

    const clientAnalytics = Object.values(clientsMap).map(client => {
        const totalInvoices = client.invoices.length;
        const unpaidInvoices = client.invoices.filter(inv => inv.status === "PENDING" || inv.status === "OVERDUE").length;
        const paidInvoices = client.invoices.filter(inv => inv.status === "PAID").length;

        let latePayments = 0;
        let totalDelayDays = 0;

        client.invoices.forEach(inv => {
            if (inv.status === "PAID") {
                const dueDate = new Date(inv.dueDate);
                const paidDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.updatedAt);
                if (paidDate > dueDate) {
                    latePayments += 1;
                    const diffTime = paidDate - dueDate;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDelayDays += Math.max(0, diffDays);
                }
            }
        });

        const unpaidRatio = totalInvoices > 0 ? (unpaidInvoices / totalInvoices) : 0;
        const averageDelayDays = paidInvoices > 0 ? Math.round(totalDelayDays / paidInvoices) : 0;
        const latePaymentFrequency = paidInvoices > 0 ? (latePayments / paidInvoices) : 0;

        let riskLevel = "Reliable";
        let riskColor = "GREEN";

        if ((unpaidRatio > 0.5 && totalInvoices >= 3) || (averageDelayDays > 14 && latePayments >= 2)) {
            riskLevel = "High Risk Client";
            riskColor = "RED";
        } else if ((unpaidRatio > 0.25 && totalInvoices >= 2) || (averageDelayDays > 5 && latePayments >= 1)) {
            riskLevel = "Moderate Risk";
            riskColor = "YELLOW";
        }

        let insight = "";
        if (paidInvoices === 0) {
            insight = `No completed payments yet (${unpaidInvoices} outstanding)`;
        } else if (averageDelayDays === 0) {
            insight = `${client.clientName} usually pays on time.`;
        } else {
            insight = `${client.clientName} usually pays ${averageDelayDays} days late.`;
        }

        return {
            clientName: client.clientName,
            clientEmail: client.clientEmail,
            totalInvoices,
            unpaidInvoices,
            paidInvoices,
            unpaidRatio,
            averageDelayDays,
            latePaymentFrequency,
            riskLevel,
            riskColor,
            insight
        };
    });

    return res.status(200).json(
        new ApiResponse(200, clientAnalytics, "Client risk scoring analytics fetched successfully")
    );
});

const sendManualReminder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.lastReminderSentAt) {
        const lastSent = new Date(invoice.lastReminderSentAt);
        const today = new Date();
        if (
            lastSent.getFullYear() === today.getFullYear() &&
            lastSent.getMonth() === today.getMonth() &&
            lastSent.getDate() === today.getDate()
        ) {
            throw new ApiError(400, "A reminder has already been sent for this invoice today. You can send another one tomorrow.");
        }
    }

    const user = await User.findById(invoice.userId);
    if (!user) {
        throw new ApiError(404, "Invoice owner not found");
    }

    const totalAmount = invoice.totalAmount || (invoice.amount + (invoice.gstAmount || 0));
    const formattedAmount = `₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' });

    const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">Pay Tracker</h1>
                <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">Smart Invoicing Solution</p>
            </div>
            <div style="border-left: 4px solid #6366f1; padding-left: 15px; margin-bottom: 20px;">
                <h2 style="color: #111827; margin: 0; font-size: 18px;">Payment Reminder</h2>
                <p style="color: #4b5563; margin-top: 8px; line-height: 1.5;">Hi ${invoice.clientName}, This is a payment reminder for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Amount Due</td>
                        <td style="text-align: right; color: #1e293b; font-size: 20px; font-weight: 700;">${formattedAmount}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 8px;">Due Date</td>
                        <td style="text-align: right; color: #1e293b; font-size: 14px; font-weight: 600; padding-top: 8px;">${dueDate}</td>
                    </tr>
                </table>
            </div>
            ${invoice.paymentLink ? `
            <p style="color: #4b5563; line-height: 1.5;">Pay securely via Razorpay. UPI, cards, netbanking, and wallets are available on the payment page.</p>
            <div style="text-align: center; margin: 25px 0;">
                <a href="${invoice.paymentLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">Pay Securely via Razorpay</a>
            </div>
            ` : `
            <p style="color: #4b5563; line-height: 1.5;">Please open your Pay Tracker invoice link to complete this payment.</p>
            `}
            <div style="margin-top: 35px; border-top: 1px solid #f1f5f9; text-align: center; padding-top: 20px;">
                <p style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
                    This invoice was sent by <strong>${user.businessName || user.name}</strong>.<br>
                    For any queries, please contact <a href="mailto:${user.email}" style="color: #6366f1;">${user.email}</a>
                </p>
            </div>
        </div>
    `;

    await sendEmail(
        invoice.clientEmail,
        `Payment Reminder: Invoice ${invoice.invoiceNumber} from ${user.businessName || user.name}`,
        emailHtml
    );

    invoice.history.push({
        action: "REMINDER_SENT",
        details: "Manual payment reminder sent by user"
    });
    invoice.lastReminderSentAt = new Date();
    await invoice.save();

    await logActivity({
        userId: user._id,
        invoiceId: invoice._id,
        action: "REMINDER_SENT",
        details: `Manual reminder sent for invoice ${invoice.invoiceNumber}`
    });

    const clientUser = await User.findOne({ email: invoice.clientEmail.toLowerCase().trim() });
    if (clientUser) {
        try {
            await Notification.create({
                userId: clientUser._id,
                title: "Payment Reminder Received",
                description: `${user.businessName || user.name} sent you a reminder for invoice ${invoice.invoiceNumber} (₹${invoice.totalAmount || invoice.amount}).`,
                type: "warning",
                category: "overdue",
            });
        } catch (e) {
            console.error("Optional client notification failed in sendManualReminder:", e.message);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Reminder email sent successfully")
    );
});

const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";

    if (!signature) {
        throw new ApiError(400, "Webhook signature missing");
    }

    // Verify signature
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(req.rawBody);
    const digest = shasum.digest("hex");

    if (digest !== signature) {
        throw new ApiError(400, "Invalid webhook signature");
    }

    const event = req.body.event;
    console.log(`[Webhook] Received Razorpay event: ${event}`);

    const payload = req.body.payload || {};
    const paymentLinkEntity = payload.payment_link?.entity;
    const paymentEntity = payload.payment?.entity;
    const razorpayLinkId = paymentLinkEntity?.id || paymentEntity?.payment_link_id;

    // Success path — payment captured / link marked paid.
    if (event === "payment_link.paid" || event === "payment.captured") {
        {
            const invoice = await findInvoiceFromRazorpayPayload(razorpayLinkId, paymentEntity);
            if (invoice && invoice.status !== "PAID") {
                invoice.status = "PAID";
                invoice.paidAt = new Date();
                const isQrPayment = !!paymentEntity?.qr_code_id || paymentEntity?.method === "upi";
                setPaidPaymentMethod(invoice, isQrPayment ? "UPI" : (paymentEntity?.method || "RAZORPAY"));
                recordPaymentSuccess(invoice, {
                    method: isQrPayment ? "UPI" : (paymentEntity?.method || "RAZORPAY"),
                    gateway: isQrPayment ? "RAZORPAY_QR" : "RAZORPAY",
                    gatewayPaymentId: paymentEntity?.id,
                    source: "razorpay-webhook",
                });

                invoice.history.push({
                    action: "PAID",
                    details: `Payment confirmed via webhook (${paymentEntity?.id || "N/A"})`
                });
                await invoice.save();
                // Invalidate the link so the same URL can't be used to pay again.
                await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                await closeRazorpayQrSafe(invoice.razorpayQrCodeId);

                await ActivityLog.create({
                    userId: invoice.userId,
                    invoiceId: invoice._id,
                    action: "PAYMENT_RECEIVED",
                    details: `Payment received via Razorpay for ${invoice.invoiceNumber}`
                });

                await sendPaymentConfirmation(invoice, "razorpay-webhook");
            }
        }
    }

    // Failure path — Razorpay fires `payment.failed` whenever a payment attempt fails.
    // We use this to instantly exit the "Verifying" state on the payer page rather
    // than waiting for the polling loop to discover the failure.
    if (event === "payment.failed") {
        {
            const invoice = await findInvoiceFromRazorpayPayload(razorpayLinkId, paymentEntity);
            if (invoice && invoice.status !== "PAID") {
                const reason = paymentEntity?.error_description || paymentEntity?.error_reason || "Payment could not be completed";
                const code = paymentEntity?.error_code || null;

                await persistPaymentFailure(invoice, reason, code, "Razorpay webhook", {
                    method: paymentEntity?.method || "RAZORPAY",
                    gateway: "RAZORPAY",
                    gatewayPaymentId: paymentEntity?.id,
                });

                try {
                    await Notification.create({
                        userId: invoice.userId,
                        title: "Payment Attempt Failed",
                        description: `A payment attempt for invoice ${invoice.invoiceNumber} failed: ${reason}.`,
                        type: "warning",
                        category: "payment"
                    });
                } catch (err) {
                    console.error("Failed to create webhook failure notification:", err.message);
                }
            }
        }
    }

    return res.status(200).json({ status: "ok" });
});

const verifyPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "PAID") {
        const confirmation = invoice.paymentConfirmation || {};
        const hasPartialConfirmation =
            confirmation.emailMerchantSentAt ||
            confirmation.emailPayerSentAt ||
            confirmation.inAppMerchantSentAt ||
            confirmation.inAppPayerSentAt;
        const hasMissingConfirmation =
            !confirmation.emailMerchantSentAt ||
            !confirmation.emailPayerSentAt ||
            !confirmation.inAppMerchantSentAt ||
            !confirmation.inAppPayerSentAt;
        if (hasPartialConfirmation && hasMissingConfirmation) {
            await sendPaymentConfirmation(invoice, "verify-payment-retry");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { verified: true, status: "PAID", isPaymentLocked: false },
                "Payment verified successfully"
            )
        );
    }

    let paymentFailed = false;
    let failureReason = null;
    let failureCode = null;
    let linkExpired = false;

    // If it's pending, let's fetch the latest status from Razorpay's API
    if (invoice.razorpayLinkId) {
        const razorpayInstance = getRazorpayInstance();
        if (razorpayInstance) {
            try {
                const plink = await razorpayInstance.paymentLink.fetch(invoice.razorpayLinkId);
                if (plink.status === "paid") {
                    invoice.status = "PAID";
                    invoice.paidAt = new Date();
                    setPaidPaymentMethod(invoice, "RAZORPAY");
                    recordPaymentSuccess(invoice, {
                        method: "RAZORPAY",
                        gateway: "RAZORPAY",
                        source: "verify-payment-link",
                    });
                    invoice.history.push({
                        action: "PAID",
                        details: `Payment verified via direct API check`
                    });
                    await invoice.save();
                    // Invalidate the link so the same URL can't be used to pay again.
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                    await closeRazorpayQrSafe(invoice.razorpayQrCodeId);

                    await ActivityLog.create({
                        userId: invoice.userId,
                        invoiceId: invoice._id,
                        action: "PAYMENT_RECEIVED",
                        details: `Payment verified via direct check for ${invoice.invoiceNumber}`
                    });

                    await sendPaymentConfirmation(invoice, "verify-payment-link");

                    return res.status(200).json(
                        new ApiResponse(
                            200,
                            { verified: true, status: "PAID", isPaymentLocked: false },
                            "Payment verified successfully"
                        )
                    );
                }

                const recentAttempts = await fetchRecentPaymentAttempts(razorpayInstance, invoice);
                const successfulAttempt = recentAttempts.find((payment) =>
                    payment.status === "captured" || payment.status === "authorized"
                );

                if (successfulAttempt) {
                    invoice.status = "PAID";
                    invoice.paidAt = new Date();
                    setPaidPaymentMethod(invoice, "RAZORPAY");
                    recordPaymentSuccess(invoice, {
                        method: successfulAttempt.method || "RAZORPAY",
                        gateway: "RAZORPAY",
                        gatewayPaymentId: successfulAttempt.id,
                        source: "verify-payment-attempt",
                    });
                    invoice.history.push({
                        action: "PAID",
                        details: "Payment verified via Razorpay payment attempt check"
                    });
                    await invoice.save();
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                    await closeRazorpayQrSafe(invoice.razorpayQrCodeId);

                    await ActivityLog.create({
                        userId: invoice.userId,
                        invoiceId: invoice._id,
                        action: "PAYMENT_RECEIVED",
                        details: `Payment verified via payment attempt check for ${invoice.invoiceNumber}`
                    });

                    await sendPaymentConfirmation(invoice, "verify-payment-attempt");

                    return res.status(200).json(
                        new ApiResponse(
                            200,
                            { verified: true, status: "PAID", isPaymentLocked: false },
                            "Payment verified successfully"
                        )
                    );
                }

                // Surface "link expired" so the UI can recommend an alternate channel.
                if (plink.status === "expired" || plink.status === "cancelled") {
                    linkExpired = true;
                }

                // Detect failed attempts since the lock engaged. We DO NOT cancel the
                // Razorpay link on failure — Razorpay's own UI lets the payer retry.
                // We just exit the verifying state so the payer isn't stuck.
                const failure = evaluateRazorpayFailure(
                    Array.isArray(plink.payments) && plink.payments.length > 0 ? plink : recentAttempts,
                    invoice.paymentInitiatedAt
                );
                if (failure.failed) {
                    paymentFailed = true;
                    failureReason = failure.reason;
                    failureCode = failure.code;
                    // Only persist if it's a new failure we haven't already recorded.
                    if (
                        !invoice.lastPaymentFailureAt ||
                        Date.now() - new Date(invoice.lastPaymentFailureAt).getTime() > 30 * 1000
                    ) {
                        await persistPaymentFailure(invoice, failureReason, failureCode, "Razorpay", {
                            method: failure.method || "RAZORPAY",
                            gateway: "RAZORPAY",
                            gatewayPaymentId: failure.gatewayPaymentId,
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch Razorpay status for ${invoice.invoiceNumber}:`, error);
            }
        }
    }

    if (!paymentFailed && await syncRazorpayQrPayment(invoice, "verify-razorpay-qr")) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { verified: true, status: "PAID", isPaymentLocked: false },
                "Payment verified successfully"
            )
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                verified: false,
                status: invoice.status,
                isPaymentLocked: isPaymentLocked(invoice),
                paymentFailed,
                failureReason,
                failureCode,
                linkExpired,
                lastPaymentFailureAt: invoice.lastPaymentFailureAt,
                paymentInitiatedAt: invoice.paymentInitiatedAt,
                paymentInitiatedChannel: invoice.paymentInitiatedChannel,
                paymentLockWindowMs: PAYMENT_LOCK_WINDOW_MS,
            },
            paymentFailed ? "Payment failed — please try again" : "Payment not yet confirmed"
        )
    );
});

const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate("userId", "name email businessName");
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "PAID") {
        return res.status(200).json(
            new ApiResponse(
                200,
                { status: "PAID", isPaymentLocked: false },
                "Invoice already paid"
            )
        );
    }

    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
        throw new ApiError(503, "Razorpay is not configured");
    }

    const order = await razorpayInstance.orders.create(buildRazorpayOrderPayload(invoice));

    if (!isPaymentLocked(invoice)) {
        invoice.paymentInitiatedAt = new Date();
        invoice.paymentInitiatedChannel = "RAZORPAY";
        recordPaymentStarted(invoice, {
            method: "RAZORPAY",
            gateway: "RAZORPAY",
            source: "razorpay-checkout-order",
        });
        invoice.history.push({
            action: "PAYMENT_INITIATED",
            details: "Payer opened Razorpay Checkout payment."
        });
        await invoice.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                key: process.env.RAZORPAY_KEY_ID,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                name: invoice.userId?.businessName || invoice.userId?.name || "Pay Tracker",
                description: `Invoice ${invoice.invoiceNumber}`,
                invoiceNumber: invoice.invoiceNumber,
                clientName: invoice.clientName,
                clientEmail: invoice.clientEmail,
            },
            "Razorpay order created"
        )
    );
});

const verifyRazorpayOrderPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Missing Razorpay payment verification fields");
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "PAID") {
        return res.status(200).json(
            new ApiResponse(
                200,
                { verified: true, status: "PAID", isPaymentLocked: false },
                "Payment already verified"
            )
        );
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, "Invalid Razorpay payment signature");
    }

    let paymentMethod = "RAZORPAY";
    const razorpayInstance = getRazorpayInstance();
    if (razorpayInstance) {
        try {
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            paymentMethod = payment?.method || "RAZORPAY";
        } catch (error) {
            console.error(`Failed to fetch Razorpay payment ${razorpay_payment_id}:`, error?.message || error);
        }
    }

    invoice.status = "PAID";
    invoice.paidAt = new Date();
    setPaidPaymentMethod(invoice, paymentMethod);
    recordPaymentSuccess(invoice, {
        method: paymentMethod,
        gateway: "RAZORPAY",
        gatewayPaymentId: razorpay_payment_id,
        source: "razorpay-checkout-verify",
    });
    invoice.history.push({
        action: "PAID",
        details: `Payment verified via Razorpay Checkout (${razorpay_payment_id})`
    });
    await invoice.save();

    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
    await closeRazorpayQrSafe(invoice.razorpayQrCodeId);

    await ActivityLog.create({
        userId: invoice.userId,
        invoiceId: invoice._id,
        action: "PAYMENT_RECEIVED",
        details: `Payment received via Razorpay Checkout for ${invoice.invoiceNumber}`
    });

    await sendPaymentConfirmation(invoice, "razorpay-checkout-verify");

    return res.status(200).json(
        new ApiResponse(
            200,
            { verified: true, status: "PAID", isPaymentLocked: false },
            "Payment verified successfully"
        )
    );
});

/**
 * Called by the public payer page right before opening the Razorpay link (or starting
 * any online payment flow). Stamps `paymentInitiatedAt` so every subsequent fetch of
 * this invoice sees the verification lock — preventing duplicate payments via UPI QR,
 * UPI ID copy, or a second Razorpay click.
 */
const initiatePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { channel } = req.body || {};
    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "PAID") {
        return res.status(200).json(
            new ApiResponse(
                200,
                { status: "PAID", isPaymentLocked: false, paymentLink: invoice.paymentLink },
                "Invoice already paid"
            )
        );
    }

    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || "http://localhost:5173";
    if (channel !== "UPI") {
        await ensureRazorpayUpiPaymentLink(invoice, frontendUrl, { force: true });
    }

    // Only refresh the stamp if we don't already have an active lock — keeps the
    // original timeout window honest if the payer clicks again.
    if (!isPaymentLocked(invoice)) {
        invoice.paymentInitiatedAt = new Date();
        invoice.paymentInitiatedChannel = channel === "UPI" ? "UPI" : "RAZORPAY";
        recordPaymentStarted(invoice, {
            method: invoice.paymentInitiatedChannel,
            gateway: invoice.paymentInitiatedChannel === "UPI" ? "UPI" : "RAZORPAY",
            source: "payment-initiated",
        });
        invoice.history.push({
            action: "PAYMENT_INITIATED",
            details: `Payer initiated ${channel === "UPI" ? "UPI/QR" : "online"} payment — verification lock engaged.`
        });
        await invoice.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                status: invoice.status,
                isPaymentLocked: true,
                paymentLink: invoice.paymentLink,
                razorpayLinkId: invoice.razorpayLinkId,
                razorpayUpiLinkEnabled: invoice.razorpayUpiLinkEnabled,
                paymentInitiatedAt: invoice.paymentInitiatedAt,
                paymentInitiatedChannel: invoice.paymentInitiatedChannel,
                paymentLockWindowMs: PAYMENT_LOCK_WINDOW_MS,
            },
            "Payment initiated — verifying"
        )
    );
});

/**
 * Lets the payer manually clear the verification lock if they abandoned the payment
 * flow (e.g. closed the Razorpay tab without paying). The frontend only surfaces this
 * action after a soft timeout to discourage panic-resets that could lead to duplicate
 * payments. We refuse if the invoice has actually been paid.
 */
const resetPaymentLock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "PAID") {
        return res.status(200).json(
            new ApiResponse(
                200,
                { status: "PAID", isPaymentLocked: false },
                "Invoice already paid"
            )
        );
    }

    invoice.paymentInitiatedAt = undefined;
    invoice.paymentInitiatedChannel = undefined;
    recordPaymentReset(invoice);
    invoice.history.push({
        action: "PAYMENT_LOCK_RESET",
        details: "Payer cleared the verification lock manually."
    });
    await invoice.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { status: invoice.status, isPaymentLocked: false },
            "Verification lock cleared"
        )
    );
});

const updateRefundStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { refundStatus, refundReference, refundReason } = req.body;

    if (!["NOT_REQUESTED", "PENDING", "PROCESSED", "FAILED"].includes(refundStatus)) {
        throw new ApiError(400, "Invalid refund status");
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can update refunds only for your own invoices");
    }

    invoice.refundStatus = refundStatus;
    invoice.refundUpdatedAt = new Date();
    invoice.refundReference = refundReference || invoice.refundReference;
    invoice.refundReason = refundReason || invoice.refundReason;
    invoice.history.push({
        action: "REFUND_STATUS_UPDATED",
        details: `Refund status updated to ${refundStatus}`
    });
    await invoice.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { paymentAudit: buildPaymentAudit(invoice, { includeSensitive: true }) },
            "Refund status updated"
        )
    );
});

export {
    createInvoice,
    getInvoices,
    getInvoiceById,
    searchInvoice,
    updateInvoiceStatus,
    getDashboardStats,
    uploadPaymentProof,
    getReceivedInvoices,
    getClientRiskAnalytics,
    sendManualReminder,
    handleRazorpayWebhook,
    verifyPayment,
    createRazorpayOrder,
    verifyRazorpayOrderPayment,
    initiatePayment,
    resetPaymentLock,
    updateRefundStatus
};
