import { Router } from "express";
import { 
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
} from "../controllers/invoice.controller.js";
import { optionalJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public Routes (No Auth)
router.route("/search").get(searchInvoice);
router.route("/webhook/razorpay").post(handleRazorpayWebhook);

// Protected Routes (Require Auth)
router.route("/stats").get(verifyJWT, getDashboardStats);
router.route("/received").get(verifyJWT, getReceivedInvoices);
router.route("/client-risk").get(verifyJWT, getClientRiskAnalytics);
router.route("/").post(verifyJWT, createInvoice).get(verifyJWT, getInvoices);

// Public dynamic routes
router.route("/:id").get(optionalJWT, getInvoiceById);
router.route("/:id/status").patch(updateInvoiceStatus);
router.route("/:id/refund-status").patch(verifyJWT, updateRefundStatus);
router.route("/:id/verify-payment").get(verifyPayment);
router.route("/:id/razorpay-order").post(createRazorpayOrder);
router.route("/:id/verify-razorpay-order").post(verifyRazorpayOrderPayment);
router.route("/:id/initiate-payment").post(initiatePayment);
router.route("/:id/reset-payment-lock").post(resetPaymentLock);

// Protected dynamic routes
router.route("/:id/proof").post(upload.single("proof"), uploadPaymentProof);
router.route("/:id/remind").post(verifyJWT, sendManualReminder);

export default router;
