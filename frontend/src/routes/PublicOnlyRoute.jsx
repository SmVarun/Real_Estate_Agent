import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { AuthSplash } from "./ProtectedRoute.jsx";

/*
 * The mirror of ProtectedRoute, for /login and /signup.
 *
 * Without it, someone already signed in who opens /login gets a form
 * that will immediately bounce them back — this sends them straight
 * to the app instead.
 */
export default function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthSplash />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
