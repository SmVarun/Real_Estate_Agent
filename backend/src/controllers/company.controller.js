import {
  companyOnboardingSchema,
  companyUpdateSchema,
} from "../validator/company.validator.js";

import {
  createCompany,
  getCompany,
  updateCompany,
} from "../services/company.services.js";

const onboardCompany = async (req, res, next) => {
  try {
    const data = companyOnboardingSchema.parse(req.body);

    const company = await createCompany(data);

    return res.status(201).json({
      success: true,
      message: "Company onboarded successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyProfile = async (req, res, next) => {
  try {
    const company = await getCompany();

    return res.status(200).json({
      success: true,
      message: "Company retrieved successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

const updateCompanyProfile = async (req, res, next) => {
  try {
    const data = companyUpdateSchema.parse(req.body);

    const company = await updateCompany(data);

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export {
  onboardCompany,
  getCompanyProfile,
  updateCompanyProfile,
};