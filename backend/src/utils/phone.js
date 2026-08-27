/*
 * Phone handling for lead contacts.
 *
 * Two separate jobs, deliberately kept apart:
 *
 *   normalisePhone  — what gets STORED and shown to a salesperson.
 *                     Whitespace and formatting punctuation collapsed,
 *                     a leading "+" preserved.
 *
 *   phoneKey        — what gets COMPARED. Digits only, so that
 *                     "+91 98765 43210", "+919876543210" and
 *                     "09876543210" are recognised as the same person
 *                     when checking for a duplicate enquiry.
 *
 * There is no libphonenumber in this project and adding one for a
 * single field is not worth the dependency, so the rule below is
 * deliberately permissive about country conventions and strict only
 * about the things that are always wrong.
 */

/* Digits, spaces, +, -, (, ) and dots — nothing else is ever a phone. */
const ALLOWED_CHARACTERS = /^[+()\-.\s\d]+$/;

const MIN_DIGITS = 7;
const MAX_DIGITS = 15; // E.164's ceiling.

/*
 * Collapse formatting without destroying the number a person typed.
 * "+91 (98765) 43210" -> "+919876543210"
 */
const normalisePhone = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  return trimmed.startsWith("+") ? `+${digits}` : digits;
};

/*
 * The comparison form. A leading country code and a leading trunk
 * "0" are both dropped down to the last MAX_LOCAL digits so the same
 * subscriber written three ways produces one key.
 */
const LOCAL_DIGITS = 10;

const phoneKey = (value) => {
  const digits = normalisePhone(value).replace(/\D/g, "");

  return digits.length > LOCAL_DIGITS
    ? digits.slice(-LOCAL_DIGITS)
    : digits;
};

/*
 * Rejects the values that are obviously not a phone number at all:
 * letters, too few or too many digits, and a single repeated digit
 * ("0000000000", "1111111111") which is the most common junk entry.
 */
const isValidPhone = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed || !ALLOWED_CHARACTERS.test(trimmed)) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return false;
  }

  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  return true;
};

export {
  normalisePhone,
  phoneKey,
  isValidPhone,
  MIN_DIGITS,
  MAX_DIGITS,
};
