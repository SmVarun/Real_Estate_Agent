import React from "react";
import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { isAdmin } from "../constants/index.js";
import EmptyState from "../components/common/EmptyState.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";

/*
 * Company and Documents are admin-only on the backend, so a manager
 * or rep opening them would get a 403 on every request.
 *
 * This renders the refusal as a page rather than redirecting, so the
 * nav entry they clicked explains itself instead of silently bouncing
 * them somewhere else. The server remains the real guard — this only
 * saves a doomed round trip.
 */
export default function AdminRoute({ title = "Restricted" }) {
  const { user } = useAuth();

  if (!isAdmin(user)) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title={title} />
        <EmptyState
          icon={ShieldAlert}
          title="Administrator access required"
          description="This section is limited to administrators. Ask an administrator to grant you access if you need it."
        />
      </div>
    );
  }

  return <Outlet />;
}
