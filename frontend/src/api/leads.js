import { api } from "./client.js";
import {
  normalizeLead,
  normalizeActivityEntry,
} from "./normalize.js";

/*
 * /api/v1/leads
 *
 * Visibility is enforced server-side: an admin or manager sees every
 * lead, a sales rep sees only the ones assigned to them. The frontend
 * does not filter for that and must not try to.
 */

export const listLeads = async ({
  status,
  source,
  assignedTo,
  search,
  page,
  limit,
  signal,
} = {}) => {
  const response = await api.get("/api/v1/leads", {
    signal,
    params: { status, source, assignedTo, search, page, limit },
  });

  return {
    leads: (response.data || []).map(normalizeLead),
    pagination: response.pagination,
  };
};

export const getLead = async (id, { signal } = {}) => {
  const response = await api.get(`/api/v1/leads/${id}`, { signal });
  return normalizeLead(response.data);
};

export const createLead = async (payload) => {
  const response = await api.post("/api/v1/leads", payload);
  return normalizeLead(response.data);
};

export const updateLead = async (id, payload) => {
  const response = await api.patch(`/api/v1/leads/${id}`, payload);
  return normalizeLead(response.data);
};

export const updateLeadStatus = async (id, status) => {
  const response = await api.patch(`/api/v1/leads/${id}/status`, { status });
  return normalizeLead(response.data);
};

/* Admin and manager only — a rep cannot reassign their own lead. */
export const assignLead = async (id, assignedTo) => {
  const response = await api.patch(`/api/v1/leads/${id}/assign`, {
    assignedTo: assignedTo || null,
  });

  return normalizeLead(response.data);
};

export const addLeadNote = async (id, text) => {
  const response = await api.post(`/api/v1/leads/${id}/notes`, { text });
  return normalizeLead(response.data);
};

export const deleteLead = (id) => api.delete(`/api/v1/leads/${id}`);

/* Dashboard counts, aggregated in the database. */
export const getLeadStats = async ({ signal } = {}) => {
  const response = await api.get("/api/v1/leads/stats", { signal });
  return response.data;
};

/* Flattened recent-first activity across every visible lead. */
export const getRecentActivity = async ({ signal } = {}) => {
  const response = await api.get("/api/v1/leads/activity", { signal });
  return (response.data || []).map(normalizeActivityEntry);
};
