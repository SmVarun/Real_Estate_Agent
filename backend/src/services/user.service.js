import User from "../models/user.model.js";
import { toPublicUser } from "../utils/user.js";
import { revokeAllUserSessions } from "./session.service.js";

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

  /*
   * No-op early so an unchanged role does not needlessly
   * revoke the target's sessions below.
   */
  if (user.role === role) {
    return toPublicUser(user);
  }

  user.role = role;
  await user.save();

  /*
   * requireAuth reads the role from the database on every
   * request, so the new role is already in force. Sessions are
   * revoked anyway on a DEMOTION-capable change: forcing a
   * fresh login re-issues tokens whose role claim matches
   * reality, so anything reading the claim cannot go stale.
   */
  await revokeAllUserSessions(user._id);

  return toPublicUser(user);
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFoundError("User not found");
  }

  return toPublicUser(user);
};

export { updateUserRole, getUserById };
