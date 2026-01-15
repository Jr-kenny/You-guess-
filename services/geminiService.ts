
import { GoogleGenAI, Type } from "@google/genai";

export const fetchNewWord = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const text = response.text || "";
    const jsonStr = text.replace(/```json|```/gi, "").trim();
    const data = JSON.parse(jsonStr);

    return {
      word: data.word.toUpperCase().trim().slice(0, 4),
      definition: data.definition
    };
  } catch (error) {
    console.error("Error fetching word from Gemini:", error);
    const fallbacks = [
      { word: "PLAY", definition: "Engage in activity for enjoyment and recreation." },
      { word: "GAME", definition: "A form of play or sport, especially a competitive one." },
      { word: "BIRD", definition: "A warm-blooded egg-laying vertebrate distinguished by feathers." },
      { word: "GOLD", definition: "A yellow precious metal, the chemical element of atomic number 79." },
      { word: "TIME", definition: "The indefinite continued progress of existence and events." },
      { word: "WORD", definition: "A single distinct meaningful element of speech or writing." }
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};
