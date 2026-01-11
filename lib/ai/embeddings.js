import OpenAI from "openai";

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      baseURL: "https://models.github.ai/inference",
      apiKey: process.env.GITHUB_TOKEN,
    });
  }
  return client;
}

/**
 * Generate embedding vector for text
 */
export async function generateEmbedding(text) {
  try {
    const response = await getClient().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    throw error;
  }
}
