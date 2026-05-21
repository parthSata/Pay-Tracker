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
    sendManualReminder
} from "../controllers/invoice.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public Routes (No Auth)
router.route("/search").get(searchInvoice);

// Protected Routes (Require Auth)
router.route("/stats").get(verifyJWT, getDashboardStats);
router.route("/received").get(verifyJWT, getReceivedInvoices);
router.route("/client-risk").get(verifyJWT, getClientRiskAnalytics);
router.route("/").post(verifyJWT, createInvoice).get(verifyJWT, getInvoices);

// Public dynamic routes
router.route("/:id").get(getInvoiceById);
router.route("/:id/status").patch(updateInvoiceStatus);

// Protected dynamic routes
router.route("/:id/proof").post(upload.single("proof"), uploadPaymentProof);
router.route("/:id/remind").post(verifyJWT, sendManualReminder);

export default router;
