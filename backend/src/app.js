import express from "express"
import router from "./routes/auth.routes.js"
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/api/v1/auth",router)

// error handler 
app.use((error, req, res, next) => {
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
