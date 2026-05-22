import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Notification } from "../models/notification.model.js";
import { Invoice } from "../models/invoice.model.js";

const getNotifications = asyncHandler(async (req, res) => {
    try {
        // Calculate smart cashflow notifications dynamically
        const allInvoices = await Invoice.find({ userId: req.user._id });
        
        const clientsMap = {};
        allInvoices.forEach(inv => {
            const email = inv.clientEmail.toLowerCase().trim();
            if (!clientsMap[email]) {
                clientsMap[email] = { invoices: [] };
            }
            clientsMap[email].invoices.push(inv);
        });

        const clientDelayMap = {};
        Object.keys(clientsMap).forEach(email => {
            const clientInvoices = clientsMap[email].invoices;
            const paidInvoices = clientInvoices.filter(inv => inv.status === "PAID");
            const unpaidInvoices = clientInvoices.filter(inv => inv.status === "PENDING" || inv.status === "OVERDUE");
            const totalInvoices = clientInvoices.length;
            
            let latePayments = 0;
            let totalDelayDays = 0;
            paidInvoices.forEach(inv => {
                const dueDate = new Date(inv.dueDate);
                const paidDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.updatedAt);
                if (paidDate > dueDate) {
                    latePayments += 1;
                    const diffTime = paidDate - dueDate;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    totalDelayDays += Math.max(0, diffDays);
                }
            });

            const unpaidRatio = totalInvoices > 0 ? (unpaidInvoices.length / totalInvoices) : 0;
            const averageDelayDays = paidInvoices.length > 0 ? Math.round(totalDelayDays / paidInvoices.length) : 0;
            
            const isRisk = (unpaidRatio > 0.5 && totalInvoices >= 3) || 
                           (averageDelayDays > 14 && latePayments >= 2) ||
                           (unpaidRatio > 0.25 && totalInvoices >= 2) || 
                           (averageDelayDays > 5 && latePayments >= 1) ||
                           (averageDelayDays > 0);

            clientDelayMap[email] = { isRisk, averageDelayDays };
        });

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const nextWeekEnd = new Date(today);
        nextWeekEnd.setDate(today.getDate() + 8);
        nextWeekEnd.setHours(23, 59, 59, 999);

        const nextWeekInvoices = allInvoices.filter(inv => {
            if (inv.status !== "PENDING") return false;
            const dueDate = new Date(inv.dueDate);
            return dueDate >= tomorrow && dueDate <= nextWeekEnd;
        });

        let totalLikelyDelayedAmount = 0;
        nextWeekInvoices.forEach(inv => {
            const email = inv.clientEmail.toLowerCase().trim();
            const clientInfo = clientDelayMap[email];
            if (clientInfo && clientInfo.isRisk) {
                const totalAmount = inv.totalAmount || (inv.amount + (inv.gstAmount || 0));
                totalLikelyDelayedAmount += totalAmount;
            }
        });

        if (totalLikelyDelayedAmount > 0) {
            const formattedAmount = `₹${totalLikelyDelayedAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
            const smartTitle = "Smart Cash Flow Alert";
            const smartDesc = `${formattedAmount} likely delayed next week based on client risk scores. Consider sending early reminders.`;

            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            const existingNotification = await Notification.findOne({
                userId: req.user._id,
                title: smartTitle,
                createdAt: { $gte: oneDayAgo }
            });

            if (!existingNotification) {
                await Notification.create({
                    userId: req.user._id,
                    title: smartTitle,
                    description: smartDesc,
                    type: "warning",
                    category: "report"
                });
            } else if (existingNotification.description !== smartDesc) {
                existingNotification.description = smartDesc;
                existingNotification.unread = true;
                await existingNotification.save();
            }
        }
    } catch (err) {
        console.error("Smart notification generation failed:", err.message);
    }

    let notifications = [];
    try {
        notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
    } catch (err) {
        console.error("getNotifications failed:", err.message);
    }

    return res.status(200).json(
        new ApiResponse(200, notifications, "Notifications fetched successfully")
    );
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid notification id");
    }
    await Notification.findByIdAndUpdate(id, { unread: false });

    return res.status(200).json(
        new ApiResponse(200, null, "Notification marked as read")
    );
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ userId: req.user._id }, { unread: false });

    return res.status(200).json(
        new ApiResponse(200, null, "All notifications marked as read")
    );
});

export {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
