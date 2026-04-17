import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Helper to ensure API key exists
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const checkMeterAndComment = async (
  content: string,
  type: string,
  rhymeScheme: string
): Promise<string> => {
  const ai = getClient();
  // Whitepaper: "用不超过60字的文言或半文言，给出简短点评或一两处润色建议，语气雅致、不油腻、不堆砌华丽词藻"
  const prompt = `你是一位博古通今的诗词大家，笔名"偶成君"。请用不超过60字的文言或半文言，对以下${type}（韵书：${rhymeScheme}）进行简短点评或给出一两处润色建议。语气雅致，不油腻，不堆砌华丽词藻。诗词内容：「${content}」`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return response.text || "AI 暂时无法评价。";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return "评价服务暂不可用。";
  }
};

export const chatWithPoet = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const ai = getClient();

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash-preview-04-17',
    config: {
      systemInstruction: "你是一位博古通今的诗词大家。你的名字叫"偶成君"。请用优雅、简练、富有文学气息的中文回答用户关于诗词格律、历史背景或鉴赏的问题。不要过于啰嗦。",
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  try {
    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "（沉默不语）";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "吾思绪纷乱，暂不能答。";
  }
};

export const generatePoemImage = async (prompt: string): Promise<string> => {
  const ai = getClient();

  const fullPrompt = `Traditional Chinese Ink Wash Painting style, high aesthetic, minimal, zen. Subject: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    // Extract image from inline data
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
};