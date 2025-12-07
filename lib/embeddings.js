import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

/**
 * Generate embedding vector for text
 */
export async function generateEmbedding(text) {
  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw error;
  }
}
