import  Company from "../models/company.model.js";


const createCompany = async (companyData)=>{
    const existingCompany = Company.findOne({
        singletonKey : "PRIMARY_COMPANY"
    })

    // if(existingCompany){
    //     const error = new Error("Company has already been onboarded.");
    //     error.statusCode = 409;
    //     throw error;
    // }
    try {
        const company = await Company.create({
            ...companyData,
            singletonKey:"PRIMARY_COMPANY",
            onboardingCompleted : true,
        })

        return company ; 
    }catch(error){
        // protct againt the duplicate company onbaording : 
        if (error.code === 11000){
            const conflictError = new Error(
                "Company onboarding has been placed "
            )
            conflictError.statusCode = 409;
            throw conflictError ; 
        }
        throw error ; 
    }


}


 
const getCompany = async () => {
  const company = await Company.findOne({
    singletonKey: "PRIMARY_COMPANY",
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
      singletonKey: "PRIMARY_COMPANY",
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