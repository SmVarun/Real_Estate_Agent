/*
 * Turn a JWT-style duration ("15m", "7d") into milliseconds.
 *
 * The same strings configure token expiry and cookie maxAge,
 * so both read from this one parser and can never drift apart.
 */
const getDurationMs = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

const getExpirationDate = (duration) => {
  return new Date(Date.now() + getDurationMs(duration));
};

export {
  getDurationMs,
  getExpirationDate,
};
