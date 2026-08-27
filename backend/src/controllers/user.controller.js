import {
  updateRoleSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from "../validator/user.validator.js";

import {
  updateUserRole,
  getUserById,
  listUsers,
} from "../services/user.service.js";
import { toPublicUser } from "../utils/user.js";

/*
 * The authenticated user's own profile.
 *
 * requireAuth already loaded them from the database, so this
 * reflects any promotion made since the token was issued.
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      data: {
        user: toPublicUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * The team roster. Every authenticated user may read it — a rep
 * needs to see who a lead is assigned to, and the shape is the same
 * public one /me returns.
 */
const listUsersHandler = async (req, res, next) => {
  try {
    const { role, includeInactive } = listUsersQuerySchema.parse(req.query);

    const users = await listUsers({ role, includeInactive });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { id } = userIdParamSchema.parse(req.params);

    const user = await getUserById(id);

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Admin-only. The route guard enforces that; this handler
 * assumes req.user is already a verified admin.
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = userIdParamSchema.parse(req.params);
    const { role } = updateRoleSchema.parse(req.body);

    const user = await updateUserRole({
      actor: req.user,
      userId: id,
      role,
    });

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export { getMe, listUsersHandler, getUser, updateRole };
