import { GoogleGenAI, Chat } from "@google/genai";

// Initialize Gemini Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createGameAssistantChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `Eres el asistente virtual oficial de "RomXD", un sitio web elegante y minimalista para descargar videojuegos (ROMs, ISOs, traducciones y hacks).
      
      Tu objetivo es ayudar a los usuarios a encontrar su próximo juego, explicar diferencias entre versiones (Hack, Translation, ISO) o solucionar dudas sobre emulación.
      
      Tono: Profesional, conciso, experto y ligeramente técnico pero accesible.
      Idioma: Español.
      
      Si te preguntan por un juego que no está en la lista mostrada, usa tu conocimiento general sobre videojuegos retro y emulación.`,
    },
  });
};

export const getGeminiResponseStream = async (chat: Chat, message: string) => {
  return await chat.sendMessageStream({ message });
};

export const translateToSpanish = async (text: string): Promise<string> => {
  if (!text) return '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Traduce la siguiente descripción de un videojuego al español. Debe sonar profesional, atractivo, natural y mantener el formato (saltos de línea). Solo devuelve el texto traducido sin introducciones:\n\n"${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Fallback to original text if translation fails
  }
};

export const translateKeywords = async (text: string): Promise<string> => {
  if (!text) return '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Traduce esta lista de géneros o etiquetas de videojuegos al español, separados por comas. Mantén un estilo breve. Ejemplo: "Fighting" -> "Lucha", "Role-playing (RPG)" -> "RPG". Solo devuelve la lista traducida:\n\n"${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error('Keyword translation failed:', error);
    return text;
  }
};