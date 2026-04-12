import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, ImageSize } from "../types";

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
  const prompt = `
    Role: Senior Classical Chinese Poetry Editor.
    Task: Review the following poem.
    Context:
    - Type: ${type}
    - Rhyme Scheme: ${rhymeScheme}
    - Poem: "${content}"

    Requirements:
    1. Briefly check tone patterns (Ping/Ze) and rhyme if the type requires it.
    2. Provide a 1-2 sentence aesthetic comment or suggestion.
    3. DO NOT output long explanations. Keep it under 100 words.
    4. If it is free verse, focus on the imagery.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
  
  // Convert our simple history to Gemini format
  // Note: For simplicity in this demo, we'll just use generateContent with history as context string
  // or use the Chat API if strictly following the rigorous structure.
  // Let's use the Chat API properly.
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "你是一位博古通今的诗词大家。你的名字叫“偶成君”。请用优雅、简练、富有文学气息的中文回答用户关于诗词格律、历史背景或鉴赏的问题。不要过于啰嗦。",
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

export const generatePoemImage = async (prompt: string, size: ImageSize): Promise<string> => {
  const ai = getClient();
  
  // Map UI sizes to API constants if needed, or just prompt context
  // gemini-3-pro-image-preview supports '1K' | '2K' | '4K' in imageConfig
  
  const fullPrompt = `Traditional Chinese Ink Wash Painting style, high aesthetic, minimal, zen. Subject: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "3:4" 
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
};