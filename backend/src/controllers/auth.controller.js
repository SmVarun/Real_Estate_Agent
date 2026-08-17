import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailQuerySchema,
} from "../validator/auth.validator.js";

import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from "../services/auth.service.js";

import {
  requestPasswordReset,
  resetPassword,
} from "../services/password-reset.service.js";

import {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
} from "../services/email-verification.service.js";

const register = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = registerSchema.parse(req.body);

    /*
     * Create user
     */
    const user = await registerUser(validatedData);

    /*
     * A failure here must not fail registration, since the
     * account has already been created.
     */
    try {
      await sendVerificationEmail(user);
    } catch (error) {
      console.error("Failed to issue verification email:", error.message);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    /*
     * Validate email and password
     */
    const validatedData = loginSchema.parse(req.body);

    /*
     * Get request metadata from the server.
     *
     * The client does NOT provide these values.
     */
    const userAgent = req.get("user-agent");
    const ipAddress = req.ip;

    /*
     * Authenticate user and create session
     */
    const result = await loginUser({
      ...validatedData,
      userAgent,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = refreshSchema.parse(req.body);

    /*
     * Get request metadata from the server.
     *
     * The client does NOT provide these values.
     */
    const userAgent = req.get("user-agent");
    const ipAddress = req.ip;

    /*
     * Rotate refresh token and issue a new token pair
     */
    const result = await refreshUserSession({
      ...validatedData,
      userAgent,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    /*
     * Validate request body (same shape as refresh)
     */
    const validatedData = refreshSchema.parse(req.body);

    /*
     * Revoke the session identified by this refresh token
     */
    await logoutUser(validatedData);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = forgotPasswordSchema.parse(req.body);

    /*
     * Always respond identically regardless of whether the
     * account exists, to avoid email enumeration.
     */
    await requestPasswordReset(validatedData);

    return res.status(200).json({
      success: true,
      message: "If the account exists, a password reset link has been sent.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = resetPasswordSchema.parse(req.body);

    /*
     * Verify token, update password, and revoke all sessions
     */
    await resetPassword(validatedData);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailHandler = async (req, res, next) => {
  try {
    /*
     * Token comes from the query string, not a JSON body.
     */
    const validatedData = verifyEmailQuerySchema.parse(req.query);

    await verifyEmail(validatedData);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = resendVerificationSchema.parse(req.body);

    /*
     * Always respond identically regardless of whether the
     * account exists or is already verified, to avoid email
     * enumeration.
     */
    await resendVerificationEmail(validatedData);

    return res.status(200).json({
      success: true,
      message: "If verification is required, a verification email has been sent.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPasswordHandler,
  verifyEmailHandler,
  resendVerification,
};