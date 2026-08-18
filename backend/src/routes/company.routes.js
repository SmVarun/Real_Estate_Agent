import express from "express";

import {
  onboardCompany,
  getCompanyProfile,
  updateCompanyProfile,
} from "../controllers/company.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authorize.middleware.js";

const companyRoutes = express.Router();

companyRoutes.use(authenticate);
companyRoutes.use(requireAdmin);

companyRoutes.post("/onboarding", onboardCompany);
companyRoutes.get("/", getCompanyProfile);
companyRoutes.patch("/", updateCompanyProfile);

export default companyRoutes;