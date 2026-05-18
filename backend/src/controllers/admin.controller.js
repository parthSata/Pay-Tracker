import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Invoice } from "../models/invoice.model.js";

const getAdminStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments({ role: "SME" });
    const totalInvoices = await Invoice.countDocuments();
    
    const revenueData = await Invoice.aggregate([
        {
            $match: { status: "PAID" }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $add: ["$amount", { $ifNull: ["$gstAmount", 0] }] } }
            }
        }
    ]);

    const pendingData = await Invoice.aggregate([
        {
            $match: { status: "PENDING" }
        },
        {
            $group: {
                _id: null,
                totalPending: { $sum: { $add: ["$amount", { $ifNull: ["$gstAmount", 0] }] } }
            }
        }
    ]);

    const recentUsers = await User.find({ role: "SME" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("-password -refreshToken");

    const recentInvoices = await Invoice.find()
        .sort({ createdAt: -1 })
        .limit(5);

    const stats = {
        totalUsers,
        totalInvoices,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        totalPending: pendingData[0]?.totalPending || 0,
        recentUsers,
        recentInvoices
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Admin stats fetched successfully")
    );
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: "SME" })
        .sort({ createdAt: -1 })
        .select("-password -refreshToken");

    // Enhance users with their invoice stats
    const usersWithStats = await Promise.all(users.map(async (user) => {
        const invoiceStats = await Invoice.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "PAID"] }, { $add: ["$amount", { $ifNull: ["$gstAmount", 0] }] }, 0]
                        }
                    }
                }
            }
        ]);

        return {
            ...user.toObject(),
            invoiceCount: invoiceStats[0]?.count || 0,
            revenue: invoiceStats[0]?.revenue || 0
        };
    }));

    return res.status(200).json(
        new ApiResponse(200, usersWithStats, "Users fetched successfully")
    );
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete user's invoices as well
    await Invoice.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, null, "User and their data deleted successfully")
    );
});

export {
    getAdminStats,
    getAllUsers,
    deleteUser
};
