import dotenv from "dotenv"
dotenv.config()

const requiredEnvVariables = [
  "PORT",
  "MONGODB_URL"  ,
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "SENDER-EMAIL",
  "APP-PASSWORD",
  "FRONTEND_URL",
  "AWS_S3_BUCKET_NAME",
  "AWS_REGION",
  "AWS_BUCKET_ACCESS_KEY",
  "AWS_BUCKET_SECRET_KEY"
  

];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const credential = {
    port : process.env.PORT,
    nodeEnv : process.env.NODE_ENV || "development",
    mongodburl : process.env.MONGODB_URL ||"" ,
    jwtaccesssecret : process.env.JWT_ACCESS_SECRET || "",
    jwtrefreshsecret : process.env.JWT_REFRESH_SECRET || "",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "",
  senderEmail : process.env["SENDER-EMAIL"] || "",
  appPassword : process.env["APP-PASSWORD"] || "",
  frontendUrl : process.env.FRONTEND_URL || "",
  awsbucketname : process.env.AWS_S3_BUCKET_NAME || "",
  awsregion : process.env.AWS_REGION || "",
  awsbucketaccesskey : process.env.AWS_BUCKET_ACCESS_KEY || "",
  awsbucketsecretkey : process.env.AWS_BUCKET_SECRET_KEY || ""


}

export default credential