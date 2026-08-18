import express from "express"
import { ZodError } from "zod"
import router from "./routes/auth.routes.js"
import companyRoutes from "./routes/company.routes.js";
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/api/v1/auth",router)
app.use("/api/v1/company", companyRoutes);

// error handler
app.use((error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  console.error(error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});
app.get("/health" , (req, res)=>{
      res.status(200).json({
        success : true , 
        message : "the server  is running healthy . "
      })
})

app.use("/api/v1", (req ,res)=>{
      res.status(404).json({
        success : false,
        message : "API route not found . "
      })
})

export default app ; 
