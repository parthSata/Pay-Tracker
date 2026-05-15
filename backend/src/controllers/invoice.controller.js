import { asyncHandler } from "../utils/asyncHandler.js";
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

const createInvoice = asyncHandler(async (req, res) => {
    const { clientName, clientEmail, amount, dueDate, paymentMethod, clientState, gstRate: manualGstRate } = req.body;

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

    // Verify if the client email actually exists in the real world (SMTP/MX checks)
    // Verify if the client email actually exists (MX records and Syntax)
    try {
        const { valid, reason, validators } = await emailValidator({
            email: clientEmail,
            validateSMTP: false,
        });
        if (!valid) {
            const reasonMsg = validators[reason]?.reason || "Invalid or non-existent email address";
            throw new ApiError(400, `Client email validation failed: ${reasonMsg}`);
        }
    } catch (err) {
        if (err instanceof ApiError) throw err;
        console.warn("Client email validation error (skipped):", err.message);
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

    // Generate Razorpay Payment Link
    let paymentLink = "";
    let razorpayLinkId;
    const razorpayInstance = getRazorpayInstance();
    if (razorpayInstance) {
        try {
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
                    email: true,
                },
                reminder_enable: true,
                notes: {
                    invoice_number: invoiceNumber,
                }
            });
            paymentLink = razorpayResponse.short_url;
            razorpayLinkId = razorpayResponse.id;
        } catch (error) {
            console.error("Razorpay Error:", error);
        }
    }

    const invoice = await Invoice.create({
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
    const invoice = await Invoice.findById(id).populate("userId", "name businessName upiId gstNumber businessState gstEnabled");

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

    // Log viewed event if not already viewed in this session (simplified)
    // We only log if it's not the owner
    if (!req.user || req.user._id.toString() !== invoice.userId._id.toString()) {
        invoice.history.push({
            action: "VIEWED",
            details: `Invoice viewed by ${req.user ? req.user.name : "Public User"}`
        });
        await invoice.save();
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
    }).populate("userId", "businessName name upiId gstNumber businessState gstEnabled");

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
        if (inv.status === "PAID") {
            stats.totalRevenue += inv.amount;
            if (inv.paidAt) {
                const paid = inv.paidAt instanceof Date ? inv.paidAt : new Date(inv.paidAt);
                if (!Number.isNaN(paid.getTime()) && paid >= thirtyDaysAgo) {
                    const dateKey = paid.toISOString().split("T")[0];
                    if (cashflowMap.has(dateKey)) {
                        cashflowMap.set(dateKey, cashflowMap.get(dateKey) + inv.amount);
                    }
                }
            }
        } else if (inv.status === "PENDING") {
            stats.pending += inv.amount;
        } else if (inv.status === "OVERDUE") {
            stats.overdue += inv.amount;
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

    return res.status(200).json(
        new ApiResponse(200, { url: uploadResult.secure_url }, "Payment proof uploaded successfully")
    );
});

const getReceivedInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ clientEmail: req.user.email })
        .populate("userId", "businessName name upiId gstNumber businessState gstEnabled")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, invoices, "Received invoices fetched successfully")
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
    getReceivedInvoices
};
