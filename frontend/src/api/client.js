/*
 * The single place the frontend talks to the backend.
 *
 * Everything goes through here so that credentials, error shaping and
 * the base URL are decided once. No component should ever call fetch()
 * directly or mention a host name.
 */

/*
 * Vite inlines this at build time. It is public by definition — only
 * ever put values here that are safe in a browser bundle.
 */
const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

/*
 * One error type for every failure, so a caller never has to tell a
 * network problem from an HTTP status from a malformed body.
 *
 *   status  0 means the request never reached the server.
 *   fieldErrors is populated only for the backend's Zod 400s.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = null, body = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.body = body;
  }

  /*
   * True when the session is gone rather than the request being wrong.
   * AuthContext uses this to decide whether to clear the user.
   */
  get isUnauthorized() {
    return this.status === 401;
  }
}

/*
 * Status -> what a person should read. The backend's own message is
 * preferred when it has one, because it is written for this domain
 * ("Email is already registered" beats "Conflict"). These are the
 * fallbacks for when it does not.
 */
const STATUS_FALLBACKS = {
  400: "The request was invalid. Please check the form and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "We could not find what you were looking for.",
  409: "That conflicts with something that already exists.",
  422: "Some of the information provided is not valid.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on the server. Please try again.",
  503: "That service is temporarily unavailable. Please try again shortly.",
};

const NETWORK_MESSAGE =
  "Unable to connect to the server. Check that the backend is running.";

/*
 * The backend's Zod handler returns
 *   { errors: [{ field, message }] }
 * which is far more useful to a form as { field: message }.
 */
const toFieldErrors = (body) => {
  if (!Array.isArray(body?.errors) || body.errors.length === 0) {
    return null;
  }

  return body.errors.reduce((accumulator, issue) => {
    if (issue?.field && !accumulator[issue.field]) {
      accumulator[issue.field] = issue.message;
    }
    return accumulator;
  }, {});
};

/*
 * A 204, a HEAD, or an error page from a proxy all fail JSON parsing.
 * None of those should surface as "Unexpected token < in JSON".
 */
const parseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const request = async (method, path, { body, signal, params } = {}) => {
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      /*
       * Undefined and null mean "filter not set" — sending them as
       * the strings "undefined"/"null" would be a real filter value.
       */
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const isFormData = body instanceof FormData;

  const options = {
    method,
    /*
     * Authentication is httpOnly cookies. Without this the browser
     * sends nothing and every authenticated call is a 401.
     */
    credentials: "include",
    headers: {},
    signal,
  };

  if (body !== undefined) {
    if (isFormData) {
      /*
       * Deliberately no Content-Type: the browser has to set it
       * itself so it can append the multipart boundary. Setting it
       * by hand produces a body the server cannot parse.
       */
      options.body = body;
    } else {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
  }

  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    /*
     * An aborted request is the caller's own doing (a component
     * unmounted, a search superseded) — it must not be reported as
     * the server being down.
     */
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError(NETWORK_MESSAGE, { status: 0 });
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const message =
      payload?.message ||
      STATUS_FALLBACKS[response.status] ||
      "The request failed. Please try again.";

    throw new ApiError(message, {
      status: response.status,
      fieldErrors: toFieldErrors(payload),
      body: payload,
    });
  }

  return payload;
};

/*
 * The backend answers with { success, message, data, ... }. Callers
 * almost always want `data`, so the api modules unwrap it — but the
 * envelope stays available here for the few that need `pagination`.
 */
export const api = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  delete: (path, options) => request("DELETE", path, options),
};

export { BASE_URL };
