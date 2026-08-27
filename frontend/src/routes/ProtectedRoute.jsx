import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

/*
 * Shown only while the startup session check is in flight. It is not
 * a page skeleton — at this point we do not yet know which page the
 * viewer is entitled to see.
 */
function AuthSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-11 w-11 animate-pulseSoft items-center justify-center rounded-xl bg-ink-800 text-brass-400">
          <KeyRound size={20} strokeWidth={2.4} />
        </div>
        <p className="text-xs font-medium text-ink-400">Signing you in…</p>
      </div>
    </div>
  );
}

/*
 * The single authentication check for the whole CRM. Pages below it
 * can assume there is a user and must not re-check.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /*
   * Rendering the app before the session is resolved would flash
   * protected pages at a signed-out visitor; redirecting before it is
   * resolved would eject a signed-in one. Wait.
   */
  if (loading) {
    return <AuthSplash />;
  }

  if (!isAuthenticated) {
    /*
     * Remember where they were headed so login can return them there
     * instead of always dropping them on the dashboard.
     */
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export { AuthSplash };
