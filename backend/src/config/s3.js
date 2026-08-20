import { S3Client } from "@aws-sdk/client-s3";
import credential from "./config.js";

const s3Client = new S3Client({
  region: credential.awsregion,
  credentials: {
    accessKeyId: credential.awsbucketaccesskey,
    secretAccessKey: credential.awsbucketsecretkey,
  },
});

export default s3Client;


