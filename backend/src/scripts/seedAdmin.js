import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import connectDB from "../db/index.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = "parth@paytracker.com";
        const adminPass = "PayTracker@1709";

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            existingAdmin.password = adminPass;
            existingAdmin.role = "ADMIN"; // Ensure role is ADMIN
            existingAdmin.isVerified = true;
            await existingAdmin.save();
        } else {
            await User.create({
                name: "Parth Admin",
                email: adminEmail,
                password: adminPass,
                role: "ADMIN",
                isVerified: true
            });
        }


        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding FAILED:", error);
        process.exit(1);
    }
};

seedAdmin();
