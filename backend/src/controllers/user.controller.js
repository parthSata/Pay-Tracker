import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import emailValidator from "deep-email-validator";

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
    const { name, email, password, businessName, upiId } = req.body

    if (
        [name, email, password].some((field) => !field || String(field)?.trim() === "")
    ) {
        throw new ApiError(400, "Name, email and password are required")
    }

    // Verify if the email actually exists in the real world (SMTP/MX checks)
    try {
        const { valid, reason, validators } = await emailValidator(email);
        if (!valid) {
            const reasonMsg = validators[reason]?.reason || "Invalid or non-existent email address";
            throw new ApiError(400, `Fake email detected: ${reasonMsg}`);
        }
    } catch (err) {
        // Fallback in case the validator crashes or network error
        if (err instanceof ApiError) throw err;
        console.warn("Email validation warning:", err);
    }

    try {
        const existedUser = await User.findOne({ email: email.toLowerCase().trim() })

        if (existedUser) {
            throw new ApiError(409, "User with email already exists")
        }

        const user = await User.create({
            name,
            email,
            password,
            businessName: businessName || "",
            upiId: upiId || ""
        })

        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered Successfully")
        )
    } catch (error) {
        // Detailed error for debugging live 400 issues
        const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
        const message = error.message || "An unexpected error occurred during registration";
        
        throw new ApiError(
            statusCode, 
            `REGISTRATION_FAILED: ${message}`, 
            error.errors || []
        );
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
    checkEmailExists
}
