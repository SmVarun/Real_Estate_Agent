/*
 * Canonical role values.
 *
 * These are the exact strings persisted in MongoDB, so they must
 * not be renamed without a data migration.
 */
const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "manager",
  SALES_REP: "sales_rep",
};

const ROLE_VALUES = Object.values(ROLES);

const DEFAULT_ROLE = ROLES.SALES_REP;

/*
 * Accept a role from a client in any casing ("admin", "ADMIN",
 * "Sales_Rep", ...) and map it back to the canonical value.
 *
 * Returns null when the value is not a known role, so callers
 * can reject it.
 */
const normalizeRole = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim().toLowerCase();

  return (
    ROLE_VALUES.find((role) => role.toLowerCase() === candidate) || null
  );
};

export { ROLES, ROLE_VALUES, DEFAULT_ROLE, normalizeRole };
