import OpenAI from "openai";

// Embeddings ran on GitHub Models until it began returning
// `github_models_retirement_brownout` — a scheduled retirement, not an outage.
// Fifty-two of fifty-eight live automations had no vector by the time this was
// noticed, so semantic search could only ever find the six generated before it
// started failing. Searching "automation that replies to my emails" therefore
// fell through to keyword scoring, which matched "Brand Deal Email Generator"
// on the word "email".
//
// Gemini is the replacement because it is the one provider already paid for
// here that emits 1536 dimensions on request — the width the `embedding`
// column was created with. Groq serves no embedding model at all. Keeping the
// width means no migration and no re-indexing.
const EMBEDDING_DIMENSIONS = 1536;

function geminiKey() {
  return process.env.MODELGROW_GEMINI_API_KEY
    || process.env.GEMINI_API_KEY
    || process.env.GOOGLE_API_KEY
    || null;
}

let legacyClient = null;
function getLegacyClient() {
  if (!legacyClient) {
    legacyClient = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey: process.env.GITHUB_TOKEN,
    });
  }
  return legacyClient;
}

async function embedWithGemini(text, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Gemini embeddings failed (${response.status})`);
  }
  const values = body?.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Gemini returned ${values?.length ?? 0} dimensions, expected ${EMBEDDING_DIMENSIONS}`);
  }
  return values;
}

/**
 * Generate embedding vector for text
 */
export async function generateEmbedding(text) {
  const key = geminiKey();
  if (key) return embedWithGemini(text, key);

  // No Gemini key configured: fall back to the old provider rather than
  // breaking search outright. This path dies with GitHub Models.
  const response = await getLegacyClient().embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text,
  });

  if (!response?.data?.[0]?.embedding) {
    throw new Error('No embedding returned from API');
  }

  return response.data[0].embedding;
}
