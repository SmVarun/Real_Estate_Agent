import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as leadsApi from "../api/leads.js";
import { listUsers } from "../api/users.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";
import { LEAD_STATUS_LABELS, canManageTeam } from "../constants/index.js";
import { uid } from "../utils/helpers.js";

const CrmContext = createContext(null);

/*
 * The CRM's data layer.
 *
 * Everything here now comes from the backend. Where an endpoint does
 * not exist the state is simply absent rather than filled in with
 * something invented: there is no property catalogue, no stored
 * conversation history and no notification store, so this context
 * exposes none of those.
 *
 * Mutations write to the server first and apply the server's own
 * response to local state. That is deliberately not optimistic: a
 * status change that the backend rejected must not linger on screen
 * looking like it worked.
 */
export function CrmProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState(null);

  /*
   * One flag per resource: the dashboard and the leads table load
   * independently and should not block on each other.
   */
  const [loading, setLoading] = useState({
    leads: true,
    salespeople: true,
    activity: true,
    stats: true,
  });

  const [errors, setErrors] = useState({
    leads: null,
    salespeople: null,
    activity: null,
    stats: null,
  });

  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, variant = "success") => {
    const id = uid("toast");
    setToasts((current) => [...current, { id, message, variant }]);

    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  /*
   * Turns any thrown value into something a person can read, and
   * shows it. Returns the message so callers can also render it
   * inline in a form.
   */
  const reportError = useCallback(
    (error, fallback = "Something went wrong.") => {
      if (error?.name === "AbortError") {
        return null;
      }

      const message =
        error instanceof ApiError ? error.message : fallback;

      pushToast(message, "error");
      return message;
    },
    [pushToast]
  );

  const setResourceLoading = useCallback((key, value) => {
    setLoading((current) => ({ ...current, [key]: value }));
  }, []);

  const setResourceError = useCallback((key, value) => {
    setErrors((current) => ({ ...current, [key]: value }));
  }, []);

  /* ---------------------------------------------------------------
   * Loading
   * ------------------------------------------------------------- */

  const loadLeads = useCallback(
    async ({ signal } = {}) => {
      setResourceLoading("leads", true);
      setResourceError("leads", null);

      try {
        /*
         * Filtering happens client-side on this list, so pull a full
         * page rather than the default. The backend caps limit at 200.
         */
        const { leads: fetched } = await leadsApi.listLeads({
          limit: 200,
          signal,
        });

        setLeads(fetched);
        return fetched;
      } catch (error) {
        if (error?.name === "AbortError") {
          return null;
        }

        setResourceError(
          "leads",
          error instanceof ApiError ? error.message : "Failed to load leads."
        );
        setLeads([]);
        return null;
      } finally {
        setResourceLoading("leads", false);
      }
    },
    [setResourceLoading, setResourceError]
  );

  const loadSalespeople = useCallback(
    async ({ signal } = {}) => {
      setResourceLoading("salespeople", true);
      setResourceError("salespeople", null);

      try {
        /*
         * The sales team is the user list — there is no separate
         * salesperson record in this CRM.
         */
        const users = await listUsers({ includeInactive: true, signal });
        setSalespeople(users);
        return users;
      } catch (error) {
        if (error?.name === "AbortError") {
          return null;
        }

        setResourceError(
          "salespeople",
          error instanceof ApiError
            ? error.message
            : "Failed to load the sales team."
        );
        setSalespeople([]);
        return null;
      } finally {
        setResourceLoading("salespeople", false);
      }
    },
    [setResourceLoading, setResourceError]
  );

  const loadActivity = useCallback(
    async ({ signal } = {}) => {
      setResourceLoading("activity", true);
      setResourceError("activity", null);

      try {
        const entries = await leadsApi.getRecentActivity({ signal });
        setActivity(entries);
        return entries;
      } catch (error) {
        if (error?.name === "AbortError") {
          return null;
        }

        setResourceError(
          "activity",
          error instanceof ApiError
            ? error.message
            : "Failed to load recent activity."
        );
        setActivity([]);
        return null;
      } finally {
        setResourceLoading("activity", false);
      }
    },
    [setResourceLoading, setResourceError]
  );

  const loadStats = useCallback(
    async ({ signal } = {}) => {
      setResourceLoading("stats", true);
      setResourceError("stats", null);

      try {
        const fetched = await leadsApi.getLeadStats({ signal });
        setStats(fetched);
        return fetched;
      } catch (error) {
        if (error?.name === "AbortError") {
          return null;
        }

        setResourceError(
          "stats",
          error instanceof ApiError
            ? error.message
            : "Failed to load dashboard statistics."
        );
        /*
         * null, not zeroes: "we could not load this" and "there are
         * none" are different things and the dashboard says so.
         */
        setStats(null);
        return null;
      } finally {
        setResourceLoading("stats", false);
      }
    },
    [setResourceLoading, setResourceError]
  );

  /*
   * Everything below needs a session, so nothing is fetched until
   * there is one — and it is all dropped on sign-out so the next
   * account never sees the previous one's data.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setLeads([]);
      setSalespeople([]);
      setActivity([]);
      setStats(null);
      setLoading({
        leads: false,
        salespeople: false,
        activity: false,
        stats: false,
      });
      return undefined;
    }

    const controller = new AbortController();
    const options = { signal: controller.signal };

    loadLeads(options);
    loadSalespeople(options);
    loadActivity(options);
    loadStats(options);

    return () => controller.abort();
  }, [isAuthenticated, loadLeads, loadSalespeople, loadActivity, loadStats]);

  /*
   * A lead mutation changes the counts and writes an activity entry,
   * so both are refetched rather than being recomputed here from a
   * partial view of the data.
   */
  const refreshDerived = useCallback(() => {
    loadStats();
    loadActivity();
  }, [loadStats, loadActivity]);

  const replaceLead = useCallback((updated) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === updated.id ? updated : lead))
    );
  }, []);

  /* ---------------------------------------------------------------
   * Mutations
   * ------------------------------------------------------------- */

  const addLead = useCallback(
    async (payload) => {
      try {
        const created = await leadsApi.createLead(payload);

        setLeads((current) => [created, ...current]);
        pushToast(`${created.name} added to leads`);
        refreshDerived();

        return created;
      } catch (error) {
        reportError(error, "Could not create the lead.");
        throw error;
      }
    },
    [pushToast, refreshDerived, reportError]
  );

  const updateLead = useCallback(
    async (id, patch) => {
      try {
        const updated = await leadsApi.updateLead(id, patch);

        replaceLead(updated);
        pushToast("Lead updated");
        refreshDerived();

        return updated;
      } catch (error) {
        reportError(error, "Could not update the lead.");
        throw error;
      }
    },
    [replaceLead, pushToast, refreshDerived, reportError]
  );

  const deleteLead = useCallback(
    async (id) => {
      const lead = leads.find((item) => item.id === id);

      try {
        await leadsApi.deleteLead(id);

        setLeads((current) => current.filter((item) => item.id !== id));
        pushToast(lead ? `${lead.name} removed` : "Lead removed", "info");
        refreshDerived();
      } catch (error) {
        reportError(error, "Could not delete the lead.");
        throw error;
      }
    },
    [leads, pushToast, refreshDerived, reportError]
  );

  const changeLeadStatus = useCallback(
    async (id, status) => {
      try {
        const updated = await leadsApi.updateLeadStatus(id, status);

        replaceLead(updated);
        pushToast(`Status updated to ${LEAD_STATUS_LABELS[status] || status}`);
        refreshDerived();

        return updated;
      } catch (error) {
        reportError(error, "Could not change the lead status.");
        throw error;
      }
    },
    [replaceLead, pushToast, refreshDerived, reportError]
  );

  const assignLead = useCallback(
    async (id, salespersonId) => {
      try {
        const updated = await leadsApi.assignLead(id, salespersonId);

        replaceLead(updated);
        pushToast(
          updated.assignee
            ? `Lead assigned to ${updated.assignee.name}`
            : "Lead unassigned"
        );
        refreshDerived();

        return updated;
      } catch (error) {
        reportError(error, "Could not assign the lead.");
        throw error;
      }
    },
    [replaceLead, pushToast, refreshDerived, reportError]
  );

  const addNoteToLead = useCallback(
    async (id, text) => {
      try {
        const updated = await leadsApi.addLeadNote(id, text);

        replaceLead(updated);
        pushToast("Note added");
        refreshDerived();

        return updated;
      } catch (error) {
        reportError(error, "Could not add the note.");
        throw error;
      }
    },
    [replaceLead, pushToast, refreshDerived, reportError]
  );

  /* ---------------------------------------------------------------
   * Derived
   * ------------------------------------------------------------- */

  /*
   * Served from the backend's aggregation when it is available.
   * `null` means the request failed, and the dashboard renders that
   * as an error rather than as a pipeline full of zeroes.
   */
  const derivedStats = useMemo(() => {
    if (!stats) {
      return null;
    }

    return {
      total: stats.total,
      new: stats.byStatus.NEW,
      contacted: stats.byStatus.CONTACTED,
      interested: stats.byStatus.INTERESTED,
      highlyInterested: stats.byStatus.HIGHLY_INTERESTED,
      qualified: stats.byStatus.QUALIFIED,
      converted: stats.byStatus.CONVERTED,
      notInterested: stats.byStatus.NOT_INTERESTED,
      lost: stats.byStatus.LOST,
      salespeople: stats.activeUsers,
      unassigned: stats.unassigned,
      byStatus: stats.byStatus,
      bySource: stats.bySource,
    };
  }, [stats]);

  /*
   * Only admins and managers may reassign — the backend enforces it,
   * and exposing it here lets the UI hide a control that would only
   * ever come back 403.
   */
  const canAssign = canManageTeam(user);

  const value = {
    leads,
    salespeople,
    activity,
    stats: derivedStats,

    loading,
    errors,
    toasts,

    canAssign,

    addLead,
    updateLead,
    deleteLead,
    changeLeadStatus,
    assignLead,
    addNoteToLead,

    refreshLeads: loadLeads,
    refreshSalespeople: loadSalespeople,
    refreshActivity: loadActivity,
    refreshStats: loadStats,

    pushToast,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);

  if (!context) {
    throw new Error("useCrm must be used within CrmProvider");
  }

  return context;
}
