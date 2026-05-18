import cron from "node-cron";
import { Invoice } from "../models/invoice.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { formatINR } from "../utils/formatINR.js";
import Razorpay from "razorpay";
import { User } from "../models/user.model.js";

// Razorpay Instance Helper
let razorpay;
const getRazorpayInstance = () => {
    if (!razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret || keyId === "your_client_id") return null;
        razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return razorpay;
};

// Helper to generate email HTML
const generateReminderEmail = (invoice, user, type) => {
    const formattedAmount = formatINR(invoice.totalAmount ?? invoice.amount);
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' });
    
    let title = "";
    let description = "";
    
    if (type === "UPCOMING") {
        title = "Upcoming Payment Reminder";
        description = `This is a friendly reminder that your payment for invoice <strong>${invoice.invoiceNumber}</strong> is due tomorrow.`;
    } else if (type === "DUE_TODAY") {
        title = "Payment Due Today";
        description = `Your payment for invoice <strong>${invoice.invoiceNumber}</strong> is due today. Please settle it to avoid any service interruption.`;
    }

    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">Pay Tracker</h1>
                <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">Smart Invoicing Solution</p>
            </div>
            <div style="border-left: 4px solid #6366f1; padding-left: 15px; margin-bottom: 20px;">
                <h2 style="color: #111827; margin: 0; font-size: 18px;">${title}</h2>
                <p style="color: #4b5563; margin-top: 8px; line-height: 1.5;">Hi ${invoice.clientName}, ${description}</p>
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
            <div style="text-align: center; margin: 25px 0;">
                <a href="${invoice.paymentLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">Pay Securely Now</a>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 12px;">Secure payment powered by Razorpay</p>
            </div>
            ` : ''}
            <div style="margin-top: 35px; pt-20 border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
                    This invoice was sent by <strong>${user.businessName || user.name}</strong>.<br>
                    You are receiving this automated reminder because your payment is pending.
                </p>
            </div>
        </div>
    `;
};

export const initCronJobs = () => {
    // Run every day at 12:00 PM
    cron.schedule("0 12 * * *", async () => {
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const rzp = getRazorpayInstance();

            // 1. Sync and Process Invoices
            const pendingInvoices = await Invoice.find({
                status: { $in: ["PENDING", "OVERDUE"] }
            }).populate("userId");

            for (const inv of pendingInvoices) {
                // First, check Razorpay status to avoid sending reminders for paid invoices
                if (rzp && inv.razorpayLinkId) {
                    try {
                        const plink = await rzp.paymentLink.fetch(inv.razorpayLinkId);
                        if (plink.status === "paid") {
                            inv.status = "PAID";
                            inv.paidAt = new Date();
                            await inv.save();
                            continue; // Skip reminder if paid
                        }
                    } catch (err) {
                        console.error(`⚠️ [CRON] Failed to sync ${inv.invoiceNumber} with Razorpay:`, err.message);
                    }
                }

                const invDueDate = new Date(inv.dueDate);
                invDueDate.setHours(0, 0, 0, 0);

                // A. Upcoming Reminder (Tomorrow)
                if (invDueDate.getTime() === tomorrow.getTime() && !inv.reminderSent1DayBefore) {
                    const html = generateReminderEmail(inv, inv.userId, "UPCOMING");
                    const sent = await sendEmail(inv.clientEmail, `Reminder: Payment due tomorrow for ${inv.invoiceNumber}`, html);
                    if (sent) {
                        inv.reminderSent1DayBefore = true;
                        await inv.save();
                    }
                }

                // B. Due Today Reminder
                if (invDueDate.getTime() === today.getTime() && !inv.reminderSentOnDueDate) {
                    const html = generateReminderEmail(inv, inv.userId, "DUE_TODAY");
                    const sent = await sendEmail(inv.clientEmail, `Final Reminder: Payment due today for ${inv.invoiceNumber}`, html);
                    if (sent) {
                        inv.reminderSentOnDueDate = true;
                        if (inv.status === "PENDING") inv.status = "OVERDUE";
                        await inv.save();
                    }
                }

                // C. Auto-mark as OVERDUE
                if (invDueDate.getTime() < today.getTime() && inv.status === "PENDING") {
                    inv.status = "OVERDUE";
                    await inv.save();
                }
            }

            // 2. Clean up unverified users older than 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const deletedUsers = await User.deleteMany({
                isVerified: false,
                createdAt: { $lt: twentyFourHoursAgo }
            });
            if (deletedUsers.deletedCount > 0) {
                console.log(`🧹 [CRON] Cleaned up ${deletedUsers.deletedCount} unverified users.`);
            }

        } catch (error) {
            console.error("❌ [CRON] Fatal Error:", error);
        }
    });
    
    console.log("🚀 [CRON] Payment reminder jobs scheduled for 12:00 PM daily");
};
