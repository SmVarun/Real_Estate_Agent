import { api } from "./client.js";
import { normalizeCompany } from "./normalize.js";

/*
 * /api/v1/company — admin only, and a singleton: there is exactly one
 * company row, so nothing here takes an id.
 *
 * GET returns 404 until onboarding has run. That is a real state the
 * UI has to show, not an error to swallow.
 */

export const getCompany = async ({ signal } = {}) => {
  const response = await api.get("/api/v1/company", { signal });
  return normalizeCompany(response.data);
};

export const onboardCompany = async (payload) => {
  const response = await api.post("/api/v1/company/onboarding", payload);
  return normalizeCompany(response.data);
};

export const updateCompany = async (payload) => {
  const response = await api.patch("/api/v1/company", payload);
  return normalizeCompany(response.data);
};
