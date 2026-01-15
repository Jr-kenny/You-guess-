
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchNewWord = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a common 4-letter English word and its short definition.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "A common 4-letter English word in uppercase." },
            definition: { type: Type.STRING, description: "A short one-sentence definition of the word." }
          },
          required: ["word", "definition"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      word: data.word.toUpperCase().trim().slice(0, 4),
      definition: data.definition
    };
  } catch (error) {
    console.error("Error fetching word from Gemini:", error);
    // Fallback word if API fails
    const fallbacks = [
      { word: "PLAY", definition: "Engage in activity for enjoyment and recreation." },
      { word: "GAME", definition: "A form of play or sport, especially a competitive one." },
      { word: "BIRD", definition: "A warm-blooded egg-laying vertebrate distinguished by feathers." },
      { word: "GOLD", definition: "A yellow precious metal, the chemical element of atomic number 79." }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};
