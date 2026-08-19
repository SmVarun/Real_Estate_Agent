/*
 * Single source of truth for roles.
 *
 * The user model enum, the role validator, and every
 * requireRole() guard read from here so a new role can
 * never be half-added.
 */
const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  SALES_REP: "sales_rep",
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/*
 * The role every new account starts on.
 *
 * Registration never accepts a client-supplied role —
 * that would let anyone self-assign admin — so every
 * account begins here and is promoted deliberately.
 */
const DEFAULT_ROLE = ROLES.SALES_REP;

export { ROLES, ROLE_VALUES, DEFAULT_ROLE };
