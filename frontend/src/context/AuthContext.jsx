import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "../api/auth.js";
import { getCurrentUser } from "../api/users.js";
import { ApiError } from "../api/client.js";

const AuthContext = createContext(null);

/*
 * Owns "who is signed in".
 *
 * Authentication is httpOnly cookies, so the browser holds the
 * credential and this context holds only the user object. Nothing
 * token-shaped is ever put in localStorage — it could not be read
 * back anyway, and storing it would undo the point of httpOnly.
 *
 * The consequence is that the only way to know whether a session is
 * live is to ask the server, which is what bootstrapping does below.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /*
   * Starts true so that the very first render is "deciding", not
   * "signed out" — otherwise ProtectedRoute would bounce a signed-in
   * user to /login before the session check came back.
   */
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async ({ signal } = {}) => {
    try {
      const currentUser = await getCurrentUser({ signal });
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      /*
       * A 401 here is the ordinary "not signed in" case, not a
       * failure worth surfacing. Anything else (server down, 500)
       * also leaves us with no user — the app cannot treat someone
       * as authenticated when it cannot confirm it.
       */
      setUser(null);
      return null;
    }
  }, []);

  /*
   * Ask the server once on startup whether the cookie it may already
   * hold is still good.
   */
  useEffect(() => {
    const controller = new AbortController();

    refreshUser({ signal: controller.signal })
      .catch(() => {
        /* Aborted by the cleanup below — the unmount is the answer. */
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [refreshUser]);

  /*
   * Login returns the user directly, so there is no second /me round
   * trip — the cookie and the user arrive together.
   */
  const login = useCallback(async ({ email, password }) => {
    const loggedIn = await authApi.login({ email, password });
    setUser(loggedIn);
    return loggedIn;
  }, []);

  /*
   * The backend signs a new account in as part of registering, so the
   * flow after this is identical to login.
   */
  const register = useCallback(async (payload) => {
    const created = await authApi.register(payload);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      /*
       * Clearing cookies is the server's job, but a failure here must
       * not strand someone in a session they asked to leave. The
       * backend's logout always succeeds anyway; this covers the
       * network being down.
       */
      if (!(error instanceof ApiError)) {
        throw error;
      }
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
