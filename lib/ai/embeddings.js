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
  const response = await getClient().embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text,
  });
  
  if (!response?.data?.[0]?.embedding) {
    throw new Error('No embedding returned from API');
  }
  
  return response.data[0].embedding;
}
