import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        clientName: {
            type: String,
            required: true,
        },
        clientEmail: {
            type: String,
            required: true,
        },
        clientState: {
            type: String,
            default: "Gujarat",
        },
        amount: { // taxable value
            type: Number,
            required: true,
        },
        gstRate: {
            type: Number,
            default: 0,
        },
        gstAmount: {
            type: Number,
            default: 0,
        },
        cgst: {
            type: Number,
            default: 0,
        },
        sgst: {
            type: Number,
            default: 0,
        },
        igst: {
            type: Number,
            default: 0,
        },
        taxType: {
            type: String,
            enum: ["CGST_SGST", "IGST", "NONE"],
            default: "NONE",
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "OVERDUE"],
            default: "PENDING",
        },
        invoiceNumber: {
            type: String,
            unique: true,
        },
        token: {
            type: String, // for public access
            required: true,
        },
        paymentLink: {
            type: String, // Razorpay link
        },
        razorpayLinkId: {
            type: String, // Razorpay Link ID (plink_...)
        },
        razorpayUpiEnabled: {
            type: Boolean,
            default: false,
        },
        razorpayUpiLinkEnabled: {
            type: Boolean,
            default: false,
        },
        razorpayQrCodeId: {
            type: String, // Razorpay QR Code ID (qr_...)
        },
        razorpayQrImageUrl: {
            type: String, // Razorpay-hosted QR image URL
        },
        razorpayQrString: {
            type: String, // UPI payload returned by Razorpay for QR generation
        },
        paymentMethod: {
            type: String,
            enum: ["UPI", "RAZORPAY", "MANUAL"],
        },
        paidAt: {
            type: Date,
        },
        // Set when a payer clicks an online payment option (e.g. Razorpay link).
        // While this timestamp is fresh (<= PAYMENT_LOCK_WINDOW_MS) and status is still PENDING,
        // the public payment view enters a "Verifying" lock to prevent duplicate payments.
        paymentInitiatedAt: {
            type: Date,
        },
        paymentInitiatedChannel: {
            type: String,
            enum: ["RAZORPAY", "UPI"],
        },
        // Captured whenever a Razorpay payment attempt fails (via webhook or polling).
        // The frontend uses this to show a "Payment Failed — Try Again" state instead of
        // staying stuck in the verifying spinner.
        lastPaymentFailureAt: {
            type: Date,
        },
        lastPaymentFailureReason: {
            type: String,
        },
        lastPaymentFailureCode: {
            type: String,
        },
        paymentProof: {
            type: String, // Cloudinary URL
        },
        paymentConfirmation: {
            emailMerchantSentAt: {
                type: Date,
            },
            emailPayerSentAt: {
                type: Date,
            },
            inAppMerchantSentAt: {
                type: Date,
            },
            inAppPayerSentAt: {
                type: Date,
            },
        },
        paymentAttempts: [
            {
                attemptNumber: {
                    type: Number,
                    required: true,
                },
                attemptedAt: {
                    type: Date,
                    default: Date.now,
                },
                method: {
                    type: String,
                    default: "RAZORPAY",
                },
                status: {
                    type: String,
                    enum: ["STARTED", "FAILED", "SUCCESS", "RESET"],
                    required: true,
                },
                amount: {
                    type: Number,
                },
                gateway: {
                    type: String,
                },
                gatewayPaymentId: {
                    type: String,
                },
                failureReason: {
                    type: String,
                },
                failureCode: {
                    type: String,
                },
                source: {
                    type: String,
                },
            }
        ],
        refundStatus: {
            type: String,
            enum: ["NOT_REQUESTED", "INITIATED", "PROCESSING", "PENDING", "PROCESSED", "FAILED"],
            default: "NOT_REQUESTED",
        },
        refundInitiatedAt: {
            type: Date,
        },
        refundUpdatedAt: {
            type: Date,
        },
        refundExpectedAt: {
            type: Date,
        },
        refundReference: {
            type: String,
        },
        refundReason: {
            type: String,
        },
        notes: {
            type: String,
        },
        reminderSent1DayBefore: {
            type: Boolean,
            default: false,
        },
        reminderSentOnDueDate: {
            type: Boolean,
            default: false,
        },
        lastReminderSentAt: {
            type: Date,
        },
        history: [
            {
                action: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                details: String
            }
        ]
    },
    {
        timestamps: true
    }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
