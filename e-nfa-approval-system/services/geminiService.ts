
import { GoogleGenAI, Type } from "@google/genai";
import { TravelRequest } from "../types";

// Always use process.env.API_KEY directly as per Gemini SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getExpertOpinion = async (request: TravelRequest) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Zuari Corporate Travel Policy Expert. Analyze this travel request for policy compliance and cost-efficiency:
      - Origin: ${request.origin}
      - Destination: ${request.destination}
      - Date: ${request.travelDate}
      - Mode: ${request.mode} (${request.travelClass})
      - Purpose: ${request.purpose}
      
      Evaluate:
      1. Is the travel mode appropriate for the distance?
      2. Suggest potential cost savings.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskLevel: { type: Type.STRING, description: "Compliance Level: High, Medium, or Low" },
            recommendation: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "riskLevel", "recommendation", "keyPoints"]
        }
      }
    });

    // Access the .text property directly from the GenerateContentResponse object
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};
