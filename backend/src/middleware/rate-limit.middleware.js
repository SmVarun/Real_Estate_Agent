/*
 * A small fixed-window rate limiter for the PUBLIC endpoints.
 *
 * In-process and in-memory on purpose: this project runs a single API
 * process and has no Redis, and pulling in a store just to throttle
 * two routes would be a bigger change than the problem warrants. The
 * consequence is honest and worth stating — counters are per-process
 * and reset on restart, so this raises the cost of abuse rather than
 * making it impossible. A multi-instance deployment needs a shared
 * store instead.
 *
 * Nothing authenticated goes through here; the CRM's own routes are
 * protected by requireAuth and are unaffected.
 */

/* key -> { count, expiresAt } */
const buckets = new Map();

/*
 * Bounded so a flood of distinct source addresses cannot grow the map
 * without limit. Sweeping only the expired entries keeps a legitimate
 * caller's counter intact.
 */
const MAX_TRACKED_KEYS = 10_000;

const sweep = (now) => {
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
    }
  }
};

/*
 * Express sits behind whatever proxy the deployment provides, and
 * req.ip is only trustworthy when "trust proxy" is configured. It is
 * the best identifier available here, so it is used with that caveat
 * rather than trusting a client-supplied header.
 */
const defaultKey = (req) => req.ip || req.socket?.remoteAddress || "unknown";

const rateLimit = ({
  windowMs,
  max,
  message = "Too many requests. Please wait a moment and try again.",
  keyGenerator = defaultKey,
} = {}) => {
  if (!windowMs || !max) {
    throw new Error("rateLimit() needs both windowMs and max");
  }

  return (req, res, next) => {
    const now = Date.now();

    if (buckets.size > MAX_TRACKED_KEYS) {
      sweep(now);
    }

    const key = `${req.baseUrl}${req.path}:${keyGenerator(req)}`;
    const existing = buckets.get(key);

    if (!existing || existing.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      const retryAfter = Math.ceil((existing.expiresAt - now) / 1000);

      res.set("Retry-After", String(retryAfter));

      const error = new Error(message);
      error.statusCode = 429;
      return next(error);
    }

    return next();
  };
};

/* Exposed for tests — never called by the request path. */
const resetRateLimits = () => buckets.clear();

export { rateLimit, resetRateLimits };
