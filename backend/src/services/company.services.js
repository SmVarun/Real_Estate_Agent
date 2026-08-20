import Company, { SINGLETON_KEY } from "../models/company.model.js";


const createCompany = async (companyData) => {
  /*
   * Fast path: reject before hitting the unique index so the
   * caller gets a clean 409 instead of a driver error.
   *
   * `singletonKey` is `select: false`, so ask for it explicitly.
   */
  const existingCompany = await Company.findOne({
    singletonKey: SINGLETON_KEY,
  }).select("_id");

  if (existingCompany) {
    const error = new Error("Company has already been onboarded.");
    error.statusCode = 409;
    throw error;
  }

  try {
    const company = await Company.create({
      ...companyData,
      singletonKey: SINGLETON_KEY,
      onboardingCompleted: true,
    });

    return company;
  } catch (error) {
    /*
     * Race guard: two concurrent onboarding requests can both
     * pass the check above, so the unique index is the real
     * enforcement point.
     */
    if (error.code === 11000) {
      const conflictError = new Error("Company has already been onboarded.");
      conflictError.statusCode = 409;
      throw conflictError;
    }

    throw error;
  }
};


 
const getCompany = async () => {
  const company = await Company.findOne({
    singletonKey: SINGLETON_KEY,
  });

  if (!company) {
    const error = new Error("Company has not been onboarded");
    error.statusCode = 404;
    throw error;
  }

  return company;
};

const updateCompany = async (companyData) => {
  const company = await Company.findOneAndUpdate(
    {
      singletonKey: SINGLETON_KEY,
    },
    {
      $set: companyData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!company) {
    const error = new Error("Company has not been onboarded");
    error.statusCode = 404;
    throw error;
  }

  return company;
};

export {
  createCompany,
  getCompany,
  updateCompany,
};