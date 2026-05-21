import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Invoice } from "../models/invoice.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import emailValidator from "deep-email-validator";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { uploadInCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const { name, email, password, businessName, upiId } = req.body;

    if (
        [name, email, password].some((field) => !field || String(field)?.trim() === "")
    ) {
        throw new ApiError(400, "Name, email and password are required")
    }

    // Verify if the email actually exists (MX records and Syntax)
    try {
        const { valid, reason, validators } = await emailValidator({
            email,
            validateSMTP: true,
            validateTypo: false,
            validateDisposable: false,
        });
        
        if (!valid) {
            const reasonMsg = validators[reason]?.reason || "Invalid or non-existent email address";
            throw new ApiError(400, `Email validation failed: ${reasonMsg}`);
        }
    } catch (err) {
        if (err instanceof ApiError) throw err;
    }

    try {
        const existedUser = await User.findOne({ email: email.toLowerCase().trim() })

        if (existedUser) {
            if (existedUser.isVerified) {
                throw new ApiError(409, "User with email already exists")
            } else {
                // If user exists but is NOT verified, resend the verification email
                const newToken = crypto.randomBytes(32).toString("hex");
                existedUser.emailVerificationToken = newToken;
                await existedUser.save({ validateBeforeSave: false });

                const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}`;
                await sendEmail(
                    email,
                    "Verify your Pay Tracker Account",
                    `
                    <h3>Welcome back!</h3>
                    <p>It looks like you haven't verified your account yet. Please click the button below to activate it:</p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Verify Email Address</a>
                    <p>${verificationUrl}</p>
                    `
                );

                return res.status(200).json(
                    new ApiResponse(200, {}, "A new verification link has been sent to your email.")
                );
            }
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = await User.create({
            name,
            email,
            password,
            businessName: businessName || "",
            upiId: upiId || "",
            isVerified: false,
            emailVerificationToken: verificationToken
        })

        if (!user) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        // Send Verification Email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await sendEmail(
            email,
            "Verify your Pay Tracker Account",
            `
            <h3>Welcome to Pay Tracker!</h3>
            <p>Please verify your email address to activate your account:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Verify Email Address</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            `
        );

        const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken")

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered Successfully")
        )
    } catch (error) {
        const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
        throw new ApiError(statusCode, error.message);
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email) {
        throw new ApiError(400, "email is required")
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email before logging in. Check your inbox!")
    }

    if (user.isTwoFactorEnabled) {
        // Send a temporary token for the second step instead of logging them in
        const tempToken = jwt.sign(
            { _id: user._id, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "5m" }
        );
        return res.status(200).json(
            new ApiResponse(200, { requires2FA: true, tempToken }, "2FA required")
        );
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { 
        name, 
        email, 
        businessName, 
        upiId,
        profilePic,
        logoUrl,
        watermarkEnabled,
        watermarkOpacity,
        brandTemplate,
        brandColor,
        brandTextColor,
        footerText,
        signatureType,
        signatureUrl,
        signatureText,
        signatureFont,
        bankDetails
    } = req.body

    if (!name || !email) {
        throw new ApiError(400, "Name and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                name,
                email,
                businessName,
                upiId,
                profilePic,
                logoUrl,
                watermarkEnabled,
                watermarkOpacity,
                brandTemplate,
                brandColor,
                brandTextColor,
                footerText,
                signatureType,
                signatureUrl,
                signatureText,
                signatureFont,
                bankDetails
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateGstSettings = asyncHandler(async (req, res) => {
    const { gstEnabled, gstNumber, defaultGstRate, businessState } = req.body

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                gstEnabled,
                gstNumber,
                defaultGstRate,
                businessState
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "GST settings updated successfully"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
})

const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = newToken;
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${newToken}`;
    await sendEmail(
        email,
        "Verify your Pay Tracker Account",
        `
        <h3>Welcome back!</h3>
        <p>You requested a new verification link. Please click the button below to activate your account:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Verify Email Address</a>
        <p>${verificationUrl}</p>
        `
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "A new verification link has been sent to your email."));
})

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        throw new ApiError(400, "Verification token is required");
    }

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Email verified successfully! You can now login."));
})

const checkEmailExists = asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (!email) {
        throw new ApiError(400, "Email query parameter is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    return res.status(200).json(
        new ApiResponse(200, { 
            exists: !!user, 
            isVerified: user?.isVerified || false 
        }, user ? "Email is registered" : "Email is available")
    );
})

const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Delete all invoices belonging to this user
    await Invoice.deleteMany({ userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);

    const options = {
        httpOnly: true,
        secure: true
    };
    
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Account deleted successfully"));
});

const generate2FA = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const secret = speakeasy.generateSecret({ name: `Pay-Tracker (${user.email})` });

    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json(
        new ApiResponse(200, { qrCodeUrl }, "2FA QR code generated")
    );
});

const enable2FA = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) throw new ApiError(400, "Token is required");

    const user = await User.findById(req.user._id);
    if (!user.twoFactorSecret) throw new ApiError(400, "2FA is not generated yet");

    const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1
    });
    if (!isValid) throw new ApiError(400, "Invalid 2FA code");

    user.isTwoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "2FA enabled successfully")
    );
});

const disable2FA = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) throw new ApiError(400, "Token and password are required");

    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid password");

    const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1
    });
    if (!isValid) throw new ApiError(400, "Invalid 2FA code");

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "2FA disabled successfully")
    );
});

const verify2FALogin = asyncHandler(async (req, res) => {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) throw new ApiError(400, "Temp token and 2FA code are required");

    let decoded;
    try {
        decoded = jwt.verify(tempToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired temporary token");
    }

    const user = await User.findById(decoded._id);
    if (!user) throw new ApiError(404, "User not found");

    const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1
    });
    if (!isValid) throw new ApiError(400, "Invalid 2FA code");

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully with 2FA"
            )
        );
});

const uploadLogo = asyncHandler(async (req, res) => {
    console.log("[DEBUG] uploadLogo: started");
    if (!req.file) {
        console.log("[DEBUG] uploadLogo: error - no file provided");
        throw new ApiError(400, "Logo file is required");
    }
    console.log("[DEBUG] uploadLogo: file details", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });
    
    const uploadResult = await uploadInCloudinary(req.file.path, "image", "Pay-Tracker/logos");
    console.log("[DEBUG] uploadLogo: Cloudinary response", uploadResult);
    
    if (!uploadResult) {
        console.log("[DEBUG] uploadLogo: error - Cloudinary upload failed");
        throw new ApiError(500, "Failed to upload logo to Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { logoUrl: uploadResult.secure_url } },
        { new: true }
    ).select("-password -refreshToken");

    console.log("[DEBUG] uploadLogo: user updated successfully");
    return res.status(200).json(
        new ApiResponse(200, user, "Logo uploaded successfully")
    );
});

const uploadSignature = asyncHandler(async (req, res) => {
    console.log("[DEBUG] uploadSignature: started");
    if (!req.file) {
        console.log("[DEBUG] uploadSignature: error - no file provided");
        throw new ApiError(400, "Signature file is required");
    }
    console.log("[DEBUG] uploadSignature: file details", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });
    
    const uploadResult = await uploadInCloudinary(req.file.path, "image", "Pay-Tracker/invoice-watermarks");
    console.log("[DEBUG] uploadSignature: Cloudinary response", uploadResult);
    
    if (!uploadResult) {
        console.log("[DEBUG] uploadSignature: error - Cloudinary upload failed");
        throw new ApiError(500, "Failed to upload signature to Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { signatureUrl: uploadResult.secure_url } },
        { new: true }
    ).select("-password -refreshToken");

    console.log("[DEBUG] uploadSignature: user updated successfully");
    return res.status(200).json(
        new ApiResponse(200, user, "Signature uploaded successfully")
    );
});

const uploadAvatar = asyncHandler(async (req, res) => {
    console.log("[DEBUG] uploadAvatar: started");
    if (!req.file) {
        console.log("[DEBUG] uploadAvatar: error - no file provided");
        throw new ApiError(400, "Avatar file is required");
    }
    console.log("[DEBUG] uploadAvatar: file details", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });
    
    const uploadResult = await uploadInCloudinary(req.file.path, "image", "Pay-Tracker/profile-images");
    console.log("[DEBUG] uploadAvatar: Cloudinary response", uploadResult);
    
    if (!uploadResult) {
        console.log("[DEBUG] uploadAvatar: error - Cloudinary upload failed");
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { profilePic: uploadResult.secure_url } },
        { new: true }
    ).select("-password -refreshToken");

    console.log("[DEBUG] uploadAvatar: user updated successfully");
    return res.status(200).json(
        new ApiResponse(200, user, "Avatar uploaded successfully")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    updateUserDetails,
    updateGstSettings,
    checkEmailExists,
    verifyEmail,
    resendVerificationEmail,
    deleteAccount,
    generate2FA,
    enable2FA,
    disable2FA,
    verify2FALogin,
    changeCurrentPassword,
    uploadLogo,
    uploadSignature,
    uploadAvatar
}
