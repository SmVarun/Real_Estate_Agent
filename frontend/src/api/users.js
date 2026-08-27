import { api } from "./client.js";
import { normalizeUser } from "./normalize.js";

/*
 * /api/v1/users
 *
 * The CRM has no separate salesperson collection — the sales team IS
 * the user list, so the Salespeople page reads from here.
 */

export const getCurrentUser = async ({ signal } = {}) => {
  const response = await api.get("/api/v1/users/me", { signal });
  return normalizeUser(response.data.user);
};

export const listUsers = async ({ role, includeInactive, signal } = {}) => {
  const response = await api.get("/api/v1/users", {
    signal,
    params: {
      role,
      includeInactive: includeInactive ? "true" : undefined,
    },
  });

  return (response.data.users || []).map(normalizeUser);
};

export const getUser = async (id, { signal } = {}) => {
  const response = await api.get(`/api/v1/users/${id}`, { signal });
  return normalizeUser(response.data.user);
};

/* Admin only. The backend refuses an admin changing their own role. */
export const updateUserRole = async (id, role) => {
  const response = await api.patch(`/api/v1/users/${id}/role`, { role });
  return normalizeUser(response.data.user);
};
