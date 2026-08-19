/*
 * Promote a user to a different role.
 *
 * Roles are never accepted from /register — that would let
 * anyone self-assign admin. Use this script (or an
 * admin-only endpoint) to grant elevated roles instead.
 *
 * Usage:
 *   node scripts/promote-user.js <email> <role>
 *
 * Example:
 *   node scripts/promote-user.js vb16vishnu@gmail.com admin
 */

import mongoose from "mongoose";

import credential from "../src/config/config.js";
import User from "../src/models/user.model.js";
import { ROLE_VALUES } from "../src/constants/roles.js";

const run = async () => {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    console.error("Usage: node scripts/promote-user.js <email> <role>");
    process.exit(1);
  }

  if (!ROLE_VALUES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${ROLE_VALUES.join(", ")}`);
    process.exit(1);
  }

  await mongoose.connect(credential.mongodburl);

  /*
   * Emails are stored lowercased by the register validator,
   * so normalise the argument the same way.
   */
  const user = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { role },
    { returnDocument: "after" }
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`${user.email} is now: ${user.role}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
