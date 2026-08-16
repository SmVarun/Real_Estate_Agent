import mongoose from "mongoose"
import credential from "./config.js"

const connectDatabase = async ()=>{
    try {

        await mongoose.connect(credential.mongodburl);
        console.log("mongodb connected successfully ...")

    }catch(err){
          console.error("Mongo db connection failed .")
          console.error(err.message)
          process.exit(1)   
    }
}

export default connectDatabase;