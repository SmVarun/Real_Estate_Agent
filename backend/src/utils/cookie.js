import credential from "../config/config.js";
import { getDurationMs } from "./date.js";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

/*
 * Tokens never reach JavaScript — httpOnly keeps them out of
 * document.cookie (so XSS cannot read them) and out of
 * localStorage entirely.
 *
 * sameSite "lax" lets top-level navigations from the frontend
 * carry the cookie while blocking cross-site POSTs; secure is
 * off in development so cookies still work over plain http.
 */
const baseCookieOptions = {
  httpOnly: true,
  secure: credential.nodeEnv === "production",
  sameSite: "lax",
  path: "/",
};

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: getDurationMs(credential.accessExpiresIn),
  });
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: getDurationMs(credential.refreshExpiresIn),
  });
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

/*
 * clearCookie only matches when the flags match the ones the
 * cookie was set with, so reuse the same options object.
 */
const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
};

export {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setAccessTokenCookie,
  setAuthCookies,
  clearAuthCookies,
};
