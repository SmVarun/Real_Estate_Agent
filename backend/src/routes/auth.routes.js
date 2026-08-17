import express from "express";
import {register , login, refresh, logout, forgotPassword, resetPasswordHandler, verifyEmailHandler, resendVerification} from "../controllers/auth.controller.js"

const router = express.Router();


//  route for the register .

router.post("/register",register)
router.post("/login",login)
router.post("/refresh",refresh)
router.post("/logout",logout)
router.post("/forgot-password",forgotPassword)
router.post("/reset-password",resetPasswordHandler)
router.get("/verify-email",verifyEmailHandler)
router.post("/resend-verification",resendVerification)


export default router