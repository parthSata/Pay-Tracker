import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser,
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
    uploadAvatar,
    toggleSubscriptionPlan
} from "../controllers/user.controller.js";
import { getActivityLogs } from "../controllers/activity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/check-email").get(checkEmailExists);
router.route("/verify-email").get(verifyEmail);
router.route("/resend-verification").post(resendVerificationEmail);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/update-account").patch(verifyJWT, updateUserDetails);
router.route("/update-gst").patch(verifyJWT, updateGstSettings);
router.route("/subscribe").post(verifyJWT, toggleSubscriptionPlan);
router.route("/delete-account").delete(verifyJWT, deleteAccount);
router.route("/activity").get(verifyJWT, getActivityLogs);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// File uploads
router.route("/upload-logo").post(verifyJWT, upload.single("logo"), uploadLogo);
router.route("/upload-signature").post(verifyJWT, upload.single("signature"), uploadSignature);
router.route("/upload-avatar").post(verifyJWT, upload.single("avatar"), uploadAvatar);

// 2FA Routes
router.route("/2fa/generate").post(verifyJWT, generate2FA);
router.route("/2fa/enable").post(verifyJWT, enable2FA);
router.route("/2fa/disable").post(verifyJWT, disable2FA);
router.route("/login/verify").post(verify2FALogin);

export default router;
