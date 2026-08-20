import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validator/auth.validator.js";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
} from "../services/auth.service.js";

import {
  requestPasswordReset,
  resetPassword,
} from "../services/password-reset.service.js";

import {
  REFRESH_TOKEN_COOKIE,
  setAccessTokenCookie,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/cookie.js";

const register = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = registerSchema.parse(req.body);

    /*
     * Create the user and sign them in immediately, so the
     * client can go straight to onboarding with the same
     * payload /login returns.
     */
    const { user, accessToken, refreshToken } = await registerUser(
      validatedData
    );

    /*
     * Tokens only ever travel in httpOnly cookies — never in
     * the JSON body, where client script could stash them.
     */
    setAuthCookies(res, { accessToken, refreshToken });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user },
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

    const { user, accessToken, refreshToken } = await loginUser(
      validatedData
    );

    setAuthCookies(res, { accessToken, refreshToken });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    /*
     * The refresh token comes from its cookie, not the body.
     * It is not rotated — only the access token is replaced.
     */
    const { accessToken } = await refreshAccessToken(
      req.cookies?.[REFRESH_TOKEN_COOKIE]
    );

    setAccessTokenCookie(res, accessToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Logout is purely a cookie operation — there is no server-side
 * state to tear down. Always succeeds, so a client with stale
 * or missing cookies can still clear itself.
 */
const logout = async (req, res, next) => {
  try {
    clearAuthCookies(res);

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
     * Verify token and update the password
     */
    await resetPassword(validatedData);

    /*
     * Sign the caller out of this browser. Tokens already
     * issued elsewhere stay valid until they expire — the
     * price of stateless authentication.
     */
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
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
};
