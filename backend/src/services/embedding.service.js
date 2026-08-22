import { InferenceClient } from "@huggingface/inference";

const model =
  process.env.HF_EMBEDDING_MODEL ||
  "sentence-transformers/all-MiniLM-L6-v2";

// Pinned instead of left on "auto" so routing is deterministic and the
// SDK stops logging a provider-selection notice on every call.
const provider = process.env.HF_PROVIDER || "hf-inference";

let client;

// Built lazily: at module-load time dotenv may not have run yet, and
// capturing an undefined token there is what turns a config mistake
// into an unauthenticated request and a bare 401.
const getClient = () => {
  if (!process.env.HF_API_KEY) {
    const error = new Error(
      "Missing required environment variable: HF_API_KEY. " +
        "Create a token at https://huggingface.co/settings/tokens with the " +
        "'Make calls to Inference Providers' permission and add it to .env"
    );
    error.statusCode = 500;
    throw error;
  }

  if (!client) {
    client = new InferenceClient(process.env.HF_API_KEY);
  }

  return client;
};

export const generateEmbedding = async (text) => {
  if (!text?.trim()) {
    const error = new Error("Text is required for embedding");
    error.statusCode = 400;
    throw error;
  }

  try {
    const result = await getClient().featureExtraction({
      model,
      provider,
      inputs: text,
    });

    // featureExtraction returns number[] for a single input, but wraps it
    // in an extra array for some models. Always hand back a flat vector.
    return Array.isArray(result[0]) ? result[0] : result;
  } catch (error) {
    if (error.httpResponse?.status === 401) {
      const authError = new Error(
        "Hugging Face rejected the API key (401). Check that HF_API_KEY is " +
          "valid, not expired, and has the 'Make calls to Inference Providers' permission."
      );
      authError.statusCode = 500;
      authError.cause = error;
      throw authError;
    }

    throw error;
  }
};

export const generateEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const embeddings = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
};
