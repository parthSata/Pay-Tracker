import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import emailValidator from "deep-email-validator";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

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
            validateSMTP: false,
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
    const { name, email, businessName, upiId } = req.body

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
                upiId
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
        new ApiResponse(200, { exists: !!user }, user ? "Email is registered" : "Email is available")
    );
})

export {
    registerUser,
    loginUser,
    logoutUser,
    updateUserDetails,
    updateGstSettings,
    checkEmailExists,
    verifyEmail,
    resendVerificationEmail
}
