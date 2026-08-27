import { api } from "./client.js";
import { normalizeUser } from "./normalize.js";

/*
 * POST /api/v1/auth/*
 *
 * Every one of these sets or clears httpOnly cookies as a side
 * effect. Nothing token-shaped is returned to JavaScript, and nothing
 * here writes to localStorage.
 */

export const login = async ({ email, password }) => {
  const response = await api.post("/api/v1/auth/login", { email, password });
  return normalizeUser(response.data.user);
};

/*
 * The backend signs a new account straight in, so the caller is
 * authenticated the moment this resolves — no follow-up login.
 *
 * `role` is intentionally not a parameter: the backend strips it and
 * every account starts as sales_rep.
 */
export const register = async ({ name, email, username, password }) => {
  const response = await api.post("/api/v1/auth/register", {
    name,
    email,
    username,
    password,
  });

  return normalizeUser(response.data.user);
};

export const logout = () => api.post("/api/v1/auth/logout");

export const refresh = () => api.post("/api/v1/auth/refresh");

export const forgotPassword = ({ email }) =>
  api.post("/api/v1/auth/forgot-password", { email });

export const resetPassword = ({ token, password }) =>
  api.post("/api/v1/auth/reset-password", { token, password });
