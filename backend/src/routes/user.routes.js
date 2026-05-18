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
    deleteAccount
} from "../controllers/user.controller.js";
import { getActivityLogs } from "../controllers/activity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
router.route("/delete-account").delete(verifyJWT, deleteAccount);
router.route("/activity").get(verifyJWT, getActivityLogs);

export default router;
