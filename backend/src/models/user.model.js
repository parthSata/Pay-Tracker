import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { encrypt, decrypt } from "../utils/encryption.js";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        role: {
            type: String,
            enum: ["SME", "ADMIN"],
            default: "SME",
        },
        upiId: {
            type: String, // used for QR payments
        },
        businessName: {
            type: String,
        },
        refreshToken: {
            type: String
        },
        gstEnabled: {
            type: Boolean,
            default: false,
        },
        gstNumber: {
            type: String,
        },
        defaultGstRate: {
            type: Number,
            default: 18,
        },
        businessState: {
            type: String,
            default: "Gujarat",
        },
        profilePic: {
            type: String,
        },
        logoUrl: {
            type: String,
        },
        watermarkEnabled: {
            type: Boolean,
            default: false,
        },
        watermarkOpacity: {
            type: Number,
            default: 0.1,
        },
        brandTemplate: {
            type: String,
            enum: ["CLASSIC", "MINIMAL", "CREATIVE", "MODERN"],
            default: "CLASSIC",
        },
        brandColor: {
            type: String,
            default: "#6366f1",
        },
        brandTextColor: {
            type: String,
            default: "#ffffff",
        },
        footerText: {
            type: String,
            default: "",
        },
        signatureType: {
            type: String,
            enum: ["NONE", "UPLOAD", "TYPED"],
            default: "NONE",
        },
        signatureUrl: {
            type: String,
        },
        signatureText: {
            type: String,
            default: "",
        },
        signatureFont: {
            type: String,
            default: "Dancing Script",
        },
        bankDetails: {
            bankName: { type: String, default: "", set: encrypt, get: decrypt },
            accountName: { type: String, default: "", set: encrypt, get: decrypt },
            accountNumber: { type: String, default: "", set: encrypt, get: decrypt },
            ifscCode: { type: String, default: "", set: encrypt, get: decrypt },
            branchName: { type: String, default: "", set: encrypt, get: decrypt },
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
        },
        isTwoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: {
            type: String,
        },
        twoFactorBackupCodes: {
            type: [String],
        }
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

export const User = mongoose.model("User", userSchema);
