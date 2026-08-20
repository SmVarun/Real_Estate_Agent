import express from "express";

import {
  onboardCompany,
  getCompanyProfile,
  updateCompanyProfile,
} from "../controllers/company.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { ROLES } from "../constants/roles.js";

const companyRoutes = express.Router();

/*
 * The company profile is org-wide configuration, so every
 * route below is admin-only.
 */
companyRoutes.use(requireAuth);
companyRoutes.use(requireRole(ROLES.ADMIN));

companyRoutes.post("/onboarding", onboardCompany);
companyRoutes.get("/", getCompanyProfile);
companyRoutes.patch("/", updateCompanyProfile);

export default companyRoutes;
