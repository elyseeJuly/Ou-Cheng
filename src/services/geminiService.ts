import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";
import { getSettings } from "./storageService";

// Helper to ensure API key exists and instantiate Google SDK
const getClient = () => {
  const settings = getSettings();
  const apiKey = settings.apiKey || '';
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const config: { apiKey: string; httpOptions?: { baseUrl?: string } } = { apiKey };
  if (settings.apiBaseUrl) {
    config.httpOptions = { baseUrl: settings.apiBaseUrl };
  }
  return new GoogleGenAI(config);
};

interface LLMOptions {
  responseJson?: boolean;
  temperature?: number;
}

// Unified call interface supporting both Google Gemini SDK and OpenAI-compatible endpoints
const callLLMApi = async (
  systemInstruction: string,
  prompt: string,
  options?: LLMOptions
): Promise<string> => {
  const settings = getSettings();
  const apiKey = settings.apiKey || '';
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const baseUrl = settings.apiBaseUrl || '';
  const isOpenAI = baseUrl && !baseUrl.includes("googleapis.com");

  if (isOpenAI) {
    const model = settings.apiModel || 'gpt-4o-mini';
    const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
    
    const messages = [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ];

    const body: any = {
      model: model,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
    };

    if (options?.responseJson) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } else {
    // Google Gemini SDK
    const ai = getClient();
    const model = settings.apiModel || 'gemini-2.5-flash-preview-04-17';
    
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: options?.temperature ?? 0.7,
    };
    if (options?.responseJson) {
      config.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config
    });
    return response.text || '';
  }
};

export const checkMeterAndComment = async (
  content: string,
  type: string,
  rhymeScheme: string
): Promise<string> => {
  try {
    const system = '你是一位博古通今的诗词大家，笔名"偶成君"。请用不超过60字的文言或半文言，对用户的作品进行简短点评或给出一两处润色建议。语气雅致，不油腻，不堆砌华丽词藻。';
    const prompt = `对以下${type}（韵书：${rhymeScheme}）进行简短点评或给出一两处润色建议：「${content}」`;

    return await callLLMApi(system, prompt, { temperature: 0.6 });
  } catch (error: any) {
    console.error("LLM Text Error:", error);
    if (error?.message === "API_KEY_MISSING") {
      return "API_KEY_MISSING";
    }
    return "评价服务暂不可用。";
  }
};

export const chatWithPoet = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  try {
    const settings = getSettings();
    const apiKey = settings.apiKey || '';
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const baseUrl = settings.apiBaseUrl || '';
    const isOpenAI = baseUrl && !baseUrl.includes("googleapis.com");
    
    const systemInstruction = "你是一位博古通今的诗词大家。你的名字叫\"偶成君\"。请用优雅、简练、富有文学气息的中文回答用户关于诗词格律、历史背景或鉴赏的问题。不要过于啰嗦。";

    if (isOpenAI) {
      const model = settings.apiModel || 'gpt-4o-mini';
      const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
      
      const messages = [
        { role: "system", content: systemInstruction },
        ...history.map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.text
        })),
        { role: "user", content: newMessage }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, temperature: 0.7 })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LLM Chat Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '（沉默不语）';
    } else {
      const ai = getClient();
      const chat = ai.chats.create({
        model: settings.apiModel || 'gemini-2.5-flash-preview-04-17',
        config: { systemInstruction },
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      });

      const response = await chat.sendMessage({ message: newMessage });
      return response.text || "（沉默不语）";
    }
  } catch (error: any) {
    console.error("LLM Chat Error:", error);
    if (error?.message === "API_KEY_MISSING") {
      return "【提示】偶成君之思绪受限，请前往「印匣」配置您的 API Key 以便进行交流。";
    }
    return "吾思绪纷乱，暂不能答。";
  }
};

export const generatePoemImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const fullPrompt = `Traditional Chinese Ink Wash Painting style, high aesthetic, minimal, zen. Subject: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: fullPrompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error: any) {
    console.error("Gemini Image Error:", error);
    if (error?.message === "API_KEY_MISSING") {
      throw new Error("API_KEY_MISSING");
    }
    throw error;
  }
};

export interface AIDetectedPoem {
  title: string;
  author: string;
  content: string;
  type: 'free' | 'jueju_5' | 'jueju_7' | 'lvshi_5' | 'lvshi_7' | 'cipai' | 'sonnet';
  sonnetType?: 'shakespeare' | 'petrarchan' | 'chinese_modern' | 'none';
  cipaiName?: string;
}

// AI smart split and classification API
export const splitAndClassifyManuscript = async (text: string): Promise<AIDetectedPoem[]> => {
  try {
    const systemInstruction = `You are a poetry parsing assistant. Your task is to split a pasted raw manuscript (which may contain one or multiple poems) and classify each poem's genre correctly.
Supported genres are:
- 'free': Modern poetry, vernacular poetry, free verse, or other uncategorized work.
- 'jueju_5': Classical Five-character Jueju (五言绝句). Must have uniform 5-char lines (ignoring punctuation) and exactly 4 lines.
- 'jueju_7': Classical Seven-character Jueju (七言绝句). Must have uniform 7-char lines (ignoring punctuation) and exactly 4 lines.
- 'lvshi_5': Classical Five-character Lvshi (五言律诗). Must have uniform 5-char lines (ignoring punctuation) and exactly 8 lines.
- 'lvshi_7': Classical Seven-character Lvshi (七言律诗). Must have uniform 7-char lines (ignoring punctuation) and exactly 8 lines.
- 'cipai': Song Lyrics (词作). Characterized by uneven line lengths, classical style, and usually has a Cipai template name (e.g., 浣溪沙, 念奴娇, 沁园春). Extract the 'cipaiName' if possible.
- 'sonnet': Fourteen-line English or Chinese Sonnet. Characterized by 14 lines, often written in English or sonnet format.

You must return a valid JSON array of objects representing the parsed poems. Return raw JSON text without markdown code blocks, or if you must use markdown, make it a clean json block.
JSON Object structure:
{
  "title": "Poem Title (string)",
  "author": "Poem Author (string, default to empty if not found)",
  "content": "Poem body content (string, lines separated by \\n)",
  "type": "one of the supported genre strings",
  "cipaiName": "string (only if genre is 'cipai')",
  "sonnetType": "one of 'shakespeare', 'petrarchan', 'chinese_modern', 'none' (only if genre is 'sonnet')"
}`;

    const prompt = `Please split and classify the following manuscript text:\n\n${text}`;
    
    const responseText = await callLLMApi(systemInstruction, prompt, {
      responseJson: true,
      temperature: 0.1
    });

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    }

    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to split and classify via AI:", error);
    throw error;
  }
};