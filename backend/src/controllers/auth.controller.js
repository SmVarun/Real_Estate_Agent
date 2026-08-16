import {
  registerSchema,
  loginSchema,
} from "../validator/auth.validator.js";

import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";

const register = async (req, res, next) => {
  try {
    /*
     * Validate request body
     */
    const validatedData = registerSchema.parse(req.body);

    /*
     * Create user
     */
    const user = await registerUser(validatedData);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    /*
     * Validate email and password
     */
    const validatedData = loginSchema.parse(req.body);

    /*
     * Get request metadata from the server.
     *
     * The client does NOT provide these values.
     */
    const userAgent = req.get("user-agent");
    const ipAddress = req.ip;

    /*
     * Authenticate user and create session
     */
    const result = await loginUser({
      ...validatedData,
      userAgent,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
};