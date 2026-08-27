import User from "../models/user.model.js";
import { toPublicUser } from "../utils/user.js";

const notFoundError = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

/*
 * Change a user's role.
 *
 * This is the ONLY way a role ever changes over HTTP.
 * Registration ignores any client-supplied role, so the
 * privilege ladder always runs through an existing admin.
 */
const updateUserRole = async ({ actor, userId, role }) => {
  /*
   * An admin demoting themselves could remove the last admin
   * and lock the system out of its own role management, with
   * no way back in short of database access. Make it explicit.
   */
  if (actor._id.toString() === userId) {
    const error = new Error("You cannot change your own role");
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    throw notFoundError("User not found");
  }

  if (user.role === role) {
    return toPublicUser(user);
  }

  user.role = role;
  await user.save();

  /*
   * requireAuth reads the role from the database on every
   * request, so the new role is in force immediately — the
   * stale role claim in the target's existing access token is
   * never used for authorization.
   */
  return toPublicUser(user);
};

/*
 * Every user in the CRM — this is the "sales team" the assignment
 * dropdown and the Salespeople page read from. There is no separate
 * salesperson collection; a salesperson IS a user with a role.
 *
 * Public shape only, and no password or 2FA field can escape through
 * it because toPublicUser whitelists what is returned.
 */
const listUsers = async ({ role, includeInactive = false } = {}) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (!includeInactive) {
    query.isActive = true;
  }

  const users = await User.find(query).sort({ createdAt: -1 });

  return users.map(toPublicUser);
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFoundError("User not found");
  }

  return toPublicUser(user);
};

export { updateUserRole, getUserById, listUsers };
