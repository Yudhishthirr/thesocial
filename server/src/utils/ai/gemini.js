import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateGeminiReply = async ({
  systemPrompt,
  userMessage,
  generationConfig,
  chatHistory = [],
}) => {
  // 1️⃣ Create chat session (THIS is the key change)
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    // generationConfig,
    history: [
      // System prompt injected as first context
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      ...chatHistory,
    ],
  });

  // 2️⃣ Send user message
  const response = await chat.sendMessage({
    message: userMessage,
  });

  // 3️⃣ Return AI reply text
  return response.text;
};
