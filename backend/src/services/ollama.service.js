/*
 * Ollama / local-LLM transport.
 *
 * This file is the ONLY place that knows how the local model is
 * reached. Everything above it (chat.service.js) just asks for an
 * answer, so swapping the provider later means rewriting this file
 * and nothing else.
 */

const DEFAULT_TIMEOUT_MS = 120000;

const baseUrl = () => {
  const url = process.env.OLLAMA_BASE_URL;

  if (!url) {
    const error = new Error(
      "Missing required environment variable: OLLAMA_BASE_URL"
    );
    error.statusCode = 500;
    throw error;
  }

  // Trailing slash would produce "//api/chat" once joined.
  return url.replace(/\/+$/, "");
};

const modelName = () => {
  const model = process.env.OLLAMA_MODEL;

  if (!model) {
    const error = new Error(
      "Missing required environment variable: OLLAMA_MODEL"
    );
    error.statusCode = 500;
    throw error;
  }

  return model;
};

const timeoutMs = () =>
  Number(process.env.OLLAMA_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

/*
 * Anything that goes wrong downstream — a refused connection, a 500
 * from the model server, a malformed body — reaches the client as the
 * same opaque 503. The real reason is logged, never serialised into a
 * response: it can carry the host, the port and the model name.
 */
const serviceUnavailable = (reason) => {
  console.error("[OLLAMA] request failed:", reason?.message || reason);

  const error = new Error(
    "The AI assistant is temporarily unavailable. Please try again in a moment."
  );

  error.statusCode = 503;
  error.cause = reason;

  return error;
};

/*
 * Two dialects are supported:
 *
 *   native — Ollama's own POST /api/chat
 *   openai — POST /v1/chat/completions, which Ollama also serves and
 *            which is the only dialect LM Studio and llama.cpp speak
 *
 * OLLAMA_API_STYLE pins one explicitly. Left on "auto" the style is
 * probed once per process and cached, so a working URL never needs an
 * extra env var to be understood.
 */
let detectedStyle;

/*
 * The probe checks the BODY, not the status code. LM Studio answers
 * unknown paths with HTTP 200 and an {"error": ...} payload, so
 * response.ok alone would misidentify it as a native Ollama daemon.
 * Only Ollama's /api/tags returns a models array.
 */
const looksLikeNativeOllama = async () => {
  try {
    const response = await fetch(`${baseUrl()}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return Array.isArray(data?.models);
  } catch {
    // A dead server also lands here; the real failure surfaces on the
    // call that follows, with a proper message.
    return false;
  }
};

const detectApiStyle = async () => {
  const configured = (process.env.OLLAMA_API_STYLE || "auto").toLowerCase();

  if (configured === "native" || configured === "openai") {
    return configured;
  }

  if (detectedStyle) {
    return detectedStyle;
  }

  detectedStyle = (await looksLikeNativeOllama()) ? "native" : "openai";

  console.log(`[OLLAMA] using ${detectedStyle} API style`);

  return detectedStyle;
};

const postJson = async (path, body) => {
  let response;

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs()),
    });
  } catch (error) {
    throw serviceUnavailable(error);
  }

  if (!response.ok) {
    // Read the body for the SERVER log only — model servers happily
    // echo prompts and file paths back inside their error payloads.
    const detail = await response.text().catch(() => "");

    throw serviceUnavailable(
      new Error(`HTTP ${response.status} from ${path}: ${detail.slice(0, 500)}`)
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw serviceUnavailable(error);
  }
};

/*
 * Ask the local model to answer, given a system instruction and a
 * fully built user prompt. Returns the plain text answer.
 */
export const generateCompletion = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
}) => {
  if (!userPrompt?.trim()) {
    const error = new Error("Prompt is required");
    error.statusCode = 400;
    throw error;
  }

  const style = await detectApiStyle();
  const model = modelName();

  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: userPrompt },
  ];

  const payload =
    style === "native"
      ? {
          model,
          messages,
          stream: false,
          options: { temperature },
        }
      : {
          model,
          messages,
          stream: false,
          temperature,
        };

  const path = style === "native" ? "/api/chat" : "/v1/chat/completions";

  const data = await postJson(path, payload);

  const answer =
    style === "native"
      ? data?.message?.content
      : data?.choices?.[0]?.message?.content;

  if (typeof answer !== "string" || !answer.trim()) {
    throw serviceUnavailable(
      new Error("Model returned an empty or unrecognised response body")
    );
  }

  return answer.trim();
};

/*
 * Lightweight reachability probe for health checks and the test
 * scripts. Never throws — returns a flat, safe-to-log result.
 */
export const checkConnection = async () => {
  const style = await detectApiStyle().catch(() => "openai");
  const path = style === "native" ? "/api/tags" : "/v1/models";

  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      signal: AbortSignal.timeout(5000),
    });

    const data = response.ok ? await response.json().catch(() => null) : null;

    // Same reasoning as the style probe: a 200 carrying an error body
    // is not a reachable model server.
    const listed = data?.models || data?.data;

    return {
      reachable: Array.isArray(listed),
      style,
      model: process.env.OLLAMA_MODEL || null,
    };
  } catch (error) {
    return {
      reachable: false,
      style,
      model: process.env.OLLAMA_MODEL || null,
      reason: error.message,
    };
  }
};
