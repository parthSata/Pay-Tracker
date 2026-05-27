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
    if (!plink || !Array.isArray(plink.payments) || plink.payments.length === 0) {
        return { failed: false, reason: null, code: null };
    }
    const initiatedMs = paymentInitiatedAt ? new Date(paymentInitiatedAt).getTime() : 0;
    // Razorpay returns `created_at` as unix seconds.
    const relevant = plink.payments.filter((p) => {
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
    };
};

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
        console.log(`[Email Validator] Starting client email validation for email: ${clientEmail}`);
        const { valid, reason, validators } = await emailValidator({
            email: clientEmail,
            validateSMTP: true,
            validateTypo: false,
            validateDisposable: false,
        });
        console.log(`[Email Validator] Results for client ${clientEmail}:`, JSON.stringify({ valid, reason, validators }, null, 2));
        
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
                console.error(`[Email Validator] Rejecting client email ${clientEmail} due to validation failure: ${reasonMsg}`);
                throw new ApiError(400, `Client email validation failed: ${reasonMsg}`);
            }
        } else {
            console.log(`[Email Validator] Client email ${clientEmail} is valid!`);
        }
    } catch (err) {
        console.error(`[Email Validator] Caught error during client validation for ${clientEmail}:`, err);
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
                notes: {
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

    // Send Invoice Email (UPI amount must match Razorpay total — inclusive of actual GST, not hardcoded 18%)
    const upiId = req.user?.upiId || "merchant@upi";
    const totalWithTax = totalAmount;
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(req.user?.businessName || req.user?.name)}&am=${totalWithTax.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoiceNumber}`)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

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
            <p>Scan the QR code below to pay instantly via any UPI app (GPay, PhonePe, Paytm):</p>
            <div style="text-align: center; margin: 20px 0;">
                <img src="${qrUrl}" alt="Payment QR Code" style="border: 1px solid #eee; border-radius: 10px; width: 180px; height: 180px;" />
            </div>
            ${paymentLink ? `
            <p>Or pay securely online via Razorpay (Cards, Netbanking, Wallets):</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${paymentLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Pay via Razorpay</a>
            </div>
            ` : ''}
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
            if (invoices[i].status === "PENDING" && invoices[i].razorpayLinkId) {
                try {
                    const plink = await razorpayInstance.paymentLink.fetch(invoices[i].razorpayLinkId);
                    if (plink.status === "paid") {
                        invoices[i].status = "PAID";
                        invoices[i].paidAt = new Date();
                        await invoices[i].save();
                        // Invalidate the link so the same URL can't be used to pay again.
                        await cancelRazorpayLinkSafe(invoices[i].razorpayLinkId);

                        await ActivityLog.create({
                            userId: invoices[i].userId,
                            invoiceId: invoices[i]._id,
                            action: "PAYMENT_RECEIVED",
                            details: `Payment received via Razorpay for ${invoices[i].invoiceNumber}`
                        });

                        try {
                            await Notification.create({
                                userId: invoices[i].userId,
                                title: "Payment Received",
                                description: `Payment of ₹${invoices[i].totalAmount || invoices[i].amount} received via Razorpay for invoice ${invoices[i].invoiceNumber}.`,
                                type: "success",
                                category: "payment"
                            });
                        } catch (err) {
                            console.error("Failed to create Razorpay payment notification:", err.message);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch status for ${invoices[i].invoiceNumber}:`, error);
                }
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, invoices, "Invoices fetched successfully")
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

    // Check Razorpay status if pending
    if (invoice.status === "PENDING" && invoice.razorpayLinkId) {
        const razorpayInstance = getRazorpayInstance();
        if (razorpayInstance) {
            try {
                const plink = await razorpayInstance.paymentLink.fetch(invoice.razorpayLinkId);
                if (plink.status === "paid") {
                    invoice.status = "PAID";
                    invoice.paidAt = new Date();
                    await invoice.save();
                    // Invalidate the link so the same URL can't be used to pay again.
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                    
                    await ActivityLog.create({
                        userId: invoice.userId._id,
                        invoiceId: invoice._id,
                        action: "PAYMENT_RECEIVED",
                        details: `Payment received via Razorpay for ${invoice.invoiceNumber}`
                    });

                    try {
                        await Notification.create({
                            userId: invoice.userId._id,
                            title: "Payment Received",
                            description: `Payment of ₹${invoice.totalAmount || invoice.amount} received via Razorpay for invoice ${invoice.invoiceNumber}.`,
                            type: "success",
                            category: "payment"
                        });
                    } catch (err) {
                        console.error("Failed to create Razorpay payment notification in getInvoiceById:", err.message);
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch status for ${invoice.invoiceNumber}:`, error);
            }
        }
    }

    // Transform userId to 'sme' for the frontend
    const invoiceData = invoice.toObject();
    invoiceData.sme = invoiceData.userId;
    delete invoiceData.userId;

    // Expose verification-lock state to the public payer view.
    // The frontend uses these to render the "Verifying your payment..." UI and hide
    // duplicate payment options, even across page reloads or fresh tabs.
    invoiceData.isPaymentLocked = isPaymentLocked(invoice);
    invoiceData.paymentLockWindowMs = PAYMENT_LOCK_WINDOW_MS;
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

    // Check Razorpay status if pending
    if (invoice.status === "PENDING" && invoice.razorpayLinkId) {
        const razorpayInstance = getRazorpayInstance();
        if (razorpayInstance) {
            try {
                const plink = await razorpayInstance.paymentLink.fetch(invoice.razorpayLinkId);
                if (plink.status === "paid") {
                    invoice.status = "PAID";
                    invoice.paidAt = new Date();
                    await invoice.save();
                    // Invalidate the link so the same URL can't be used to pay again.
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);
                }
            } catch (error) {
                console.error(`Failed to fetch status for ${invoice.invoiceNumber}:`, error);
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, invoice, "Invoice found")
    );
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PENDING", "PAID", "OVERDUE"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const invoice = await Invoice.findByIdAndUpdate(
        id,
        { 
            status,
            paidAt: status === "PAID" ? new Date() : null
        },
        { new: true }
    );

    if (!invoice) {
        throw new ApiError(404, "Invoice not found");
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

    if (status === "PAID") {
        try {
            await Notification.create({
                userId: invoice.userId,
                title: "Payment Received",
                description: `Invoice ${invoice.invoiceNumber} has been marked as PAID.`,
                type: "success",
                category: "payment"
            });
        } catch (err) {
            console.error("Failed to create manual payment notification:", err.message);
        }
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

    return res.status(200).json(
        new ApiResponse(200, invoices, "Received invoices fetched successfully")
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

    const upiId = user.upiId || "merchant@upi";
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(user.businessName || user.name)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

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
            <p>Scan the QR code below to pay instantly via any UPI app:</p>
            <div style="text-align: center; margin: 20px 0;">
                <img src="${qrUrl}" alt="Payment QR Code" style="border: 1px solid #eee; border-radius: 10px; width: 180px; height: 180px;" />
            </div>
            ${invoice.paymentLink ? `
            <div style="text-align: center; margin: 25px 0;">
                <a href="${invoice.paymentLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">Pay Securely via Razorpay</a>
            </div>
            ` : ''}
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
        if (razorpayLinkId) {
            const invoice = await Invoice.findOne({ razorpayLinkId });
            if (invoice && invoice.status !== "PAID") {
                invoice.status = "PAID";
                invoice.paidAt = new Date();
                if (paymentEntity?.method) {
                    invoice.paymentMethod = paymentEntity.method.toUpperCase();
                }
                
                invoice.history.push({
                    action: "PAID",
                    details: `Payment confirmed via webhook (${paymentEntity?.id || "N/A"})`
                });
                await invoice.save();
                // Invalidate the link so the same URL can't be used to pay again.
                await cancelRazorpayLinkSafe(invoice.razorpayLinkId);

                await ActivityLog.create({
                    userId: invoice.userId,
                    invoiceId: invoice._id,
                    action: "PAYMENT_RECEIVED",
                    details: `Payment received via Razorpay for ${invoice.invoiceNumber}`
                });

                try {
                    await Notification.create({
                        userId: invoice.userId,
                        title: "Payment Confirmed (Webhook)",
                        description: `Payment of ₹${invoice.totalAmount || invoice.amount} confirmed for invoice ${invoice.invoiceNumber}.`,
                        type: "success",
                        category: "payment"
                    });
                } catch (err) {
                    console.error("Failed to create webhook payment notification:", err.message);
                }
            }
        }
    }

    // Failure path — Razorpay fires `payment.failed` whenever a payment attempt fails.
    // We use this to instantly exit the "Verifying" state on the payer page rather
    // than waiting for the polling loop to discover the failure.
    if (event === "payment.failed") {
        if (razorpayLinkId) {
            const invoice = await Invoice.findOne({ razorpayLinkId });
            if (invoice && invoice.status !== "PAID") {
                const reason = paymentEntity?.error_description || paymentEntity?.error_reason || "Payment could not be completed";
                const code = paymentEntity?.error_code || null;

                invoice.lastPaymentFailureAt = new Date();
                invoice.lastPaymentFailureReason = reason;
                invoice.lastPaymentFailureCode = code;
                // Release the verification lock so the payer can immediately retry.
                invoice.paymentInitiatedAt = undefined;
                invoice.history.push({
                    action: "PAYMENT_FAILED",
                    details: `Razorpay payment failed: ${reason}${code ? ` (${code})` : ""}`
                });
                await invoice.save();

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
                    invoice.history.push({
                        action: "PAID",
                        details: `Payment verified via direct API check`
                    });
                    await invoice.save();
                    // Invalidate the link so the same URL can't be used to pay again.
                    await cancelRazorpayLinkSafe(invoice.razorpayLinkId);

                    await ActivityLog.create({
                        userId: invoice.userId,
                        invoiceId: invoice._id,
                        action: "PAYMENT_RECEIVED",
                        details: `Payment verified via direct check for ${invoice.invoiceNumber}`
                    });

                    try {
                        await Notification.create({
                            userId: invoice.userId,
                            title: "Payment Verified",
                            description: `Payment of ₹${invoice.totalAmount || invoice.amount} verified for invoice ${invoice.invoiceNumber}.`,
                            type: "success",
                            category: "payment"
                        });
                    } catch (err) {
                        console.error("Failed to create verified notification:", err.message);
                    }

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
                const failure = evaluateRazorpayFailure(plink, invoice.paymentInitiatedAt);
                if (failure.failed) {
                    paymentFailed = true;
                    failureReason = failure.reason;
                    failureCode = failure.code;
                    // Only persist if it's a new failure we haven't already recorded.
                    if (
                        !invoice.lastPaymentFailureAt ||
                        Date.now() - new Date(invoice.lastPaymentFailureAt).getTime() > 30 * 1000
                    ) {
                        invoice.lastPaymentFailureAt = new Date();
                        invoice.lastPaymentFailureReason = failureReason;
                        invoice.lastPaymentFailureCode = failureCode;
                        // Clearing the lock lets the payer retry from PayTracker too.
                        invoice.paymentInitiatedAt = undefined;
                        invoice.history.push({
                            action: "PAYMENT_FAILED",
                            details: `Razorpay payment failed: ${failureReason}${failureCode ? ` (${failureCode})` : ""}`
                        });
                        await invoice.save();
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch Razorpay status for ${invoice.invoiceNumber}:`, error);
            }
        }
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
                paymentLockWindowMs: PAYMENT_LOCK_WINDOW_MS,
            },
            paymentFailed ? "Payment failed — please try again" : "Payment not yet confirmed"
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

    // Only refresh the stamp if we don't already have an active lock — keeps the
    // original timeout window honest if the payer clicks again.
    if (!isPaymentLocked(invoice)) {
        invoice.paymentInitiatedAt = new Date();
        invoice.history.push({
            action: "PAYMENT_INITIATED",
            details: "Payer initiated online payment — verification lock engaged."
        });
        await invoice.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                status: invoice.status,
                isPaymentLocked: true,
                paymentInitiatedAt: invoice.paymentInitiatedAt,
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
    initiatePayment,
    resetPaymentLock
};
