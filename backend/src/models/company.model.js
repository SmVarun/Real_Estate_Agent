import mongoose from "mongoose";

/*
 * Every company document carries this same key, so the unique
 * index on it allows exactly one document to exist.
 */
const SINGLETON_KEY = "PRIMARY_COMPANY";
const companySchema = mongoose.Schema({
    businessName : {
        type : String,
        required : true ,
        trim : true,
        minLength:2,
        maxLength:150
    },
    legalName: {
        type : String ,
        required : true,
        trim : true ,
        minLength : 2,
        maxLength:150
    },
    industry : {
        type : String ,
        required : true ,
        trim : true,
        maxLength:200,
    },
    description : {
        type : String ,
        required : true ,
        trim : true ,
        maxLength:2000
    },
    website : {
        type : String ,
        default : "",
        trim : true,
    },
    email : {
      type: String,
      required: true,
      trim: true,
      lowercase: true, 
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        trim: true,
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
    },
     socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      twitter: {
        type: String,
        trim: true,
        default: "",
      },

      facebook: {
        type: String,
        trim: true,
        default: "",
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
      },
    },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    employeeCount: {
      type: Number,
      min: 1,
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
        // Ensures that only ONE company can exist.
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: SINGLETON_KEY,
      enum: [SINGLETON_KEY],
      select: false,
    },
  


},{
    timestamps : true 
})


const Company = mongoose.model("Company",companySchema)

/*
 * The singleton guarantee rests entirely on the unique index.
 * If duplicate company documents already exist in the database,
 * the background index build fails silently and onboarding stops
 * being protected, so surface that instead of swallowing it.
 */
Company.on("index", (error) => {
  if (error) {
    console.error(
      "Failed to build the Company singleton index — duplicate companies may exist:",
      error.message
    );
  }
});

export { SINGLETON_KEY };
export default Company ;
