import { z } from "zod";
import mongoose from "mongoose";

import { ROLE_VALUES } from "../constants/roles.js";

const objectId = z
  .string()
  .trim()
  .refine(
    (value) => mongoose.Types.ObjectId.isValid(value),
    "Invalid user id"
  );

const updateRoleSchema = z.object({
  role: z.enum(ROLE_VALUES, {
    message: `Role must be one of: ${ROLE_VALUES.join(", ")}`,
  }),
});

const userIdParamSchema = z.object({
  id: objectId,
});

export { updateRoleSchema, userIdParamSchema };
