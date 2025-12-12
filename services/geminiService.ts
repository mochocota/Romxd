import { GoogleGenAI, Chat } from "@google/genai";

// Initialize Gemini Client
// IMPORTANT: In Vercel, ensuring we read from import.meta.env is more reliable for Vite apps
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

// Note: Ensure VITE_GEMINI_API_KEY is set in your .env file locally AND in Vercel Environment Variables
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const createGameAssistantChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are the official AI assistant for "RomXD", a minimalist video game download blog.
      
      Goal: Help users find games, explain version differences (Hack, Translation, ISO), and answer emulation questions.
      
      Tone: Professional, concise, expert, yet accessible.
      Language: Spanish (Español).
      
      If asked about a game not in the list, use your general knowledge about retro gaming.`,
    },
  });
};

export const getGeminiResponseStream = async (chat: Chat, message: string) => {
  return await chat.sendMessageStream({ message });
};

export const translateToSpanish = async (text: string): Promise<string> => {
  if (!text) return '';
  
  // Debug check for API Key
  if (!API_KEY) {
    console.warn('RomXD: API_KEY is missing. Translation skipped. Please add VITE_GEMINI_API_KEY to Vercel Environment Variables.');
    return text;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        temperature: 0.3, // Lower temperature for more accurate translation
      },
      contents: `You are a professional video game translator. Translate the following text to Spanish (Español). 
      
      Rules:
      - Keep the tone professional and exciting.
      - Maintain all formatting, paragraphs, and lists.
      - Do not add introductory text like "Here is the translation".
      - Output ONLY the translated text.

      Text to translate:
      "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Fallback to original text if translation fails
  }
};

export const translateKeywords = async (text: string): Promise<string> => {
  if (!text) return '';
  
  if (!API_KEY) return text;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { temperature: 0.3 },
      contents: `Translate this list of video game genres/tags to Spanish, separated by commas. 
      Keep it concise. 
      Example: "Fighting" -> "Lucha", "Role-playing (RPG)" -> "Rol (RPG)". 
      Output ONLY the comma-separated list.
      
      Input: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Keyword translation failed:', error);
    return text;
  }
};