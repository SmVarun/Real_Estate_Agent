import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { ZodError } from "zod"

import credential from "./config/config.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import companyRouter from "./routes/company.routes.js"
import documentRoutes from "./routes/document.routes.js";
import chatRouter from "./routes/chat.routes.js";
const app = express()

/*
 * Authentication rides on cookies, so the browser only attaches
 * them when the response names an explicit origin and allows
 * credentials — "*" is invalid in that combination.
 */
app.use(cors({
  origin: credential.frontendUrl,
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/*
 * Populates req.cookies, which requireAuth and /auth/refresh
 * read the access and refresh tokens from.
 */
app.use(cookieParser())

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "the server  is running healthy . "
  })
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/company", companyRouter)
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found . "
  })
})

/*
 * Error handler must be registered LAST — Express only sends
 * an error to handlers declared after the route that threw it.
 */
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

  /*
   * 4xx are expected client mistakes, not incidents — only
   * log what actually needs investigating.
   */
  if (!error.statusCode || error.statusCode >= 500) {
    console.error(error);
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

export default app ; 
