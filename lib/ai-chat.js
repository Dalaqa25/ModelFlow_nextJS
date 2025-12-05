/**
 * Simple AI chat utility for sending messages to the chat API
 */
export async function sendChatMessage(messages) {
  try {
    const response = await fetch("/api/ai/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}
