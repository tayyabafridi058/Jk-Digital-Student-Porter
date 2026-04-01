import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getCourseRecommendation(interests: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a career counselor for JK Digital Marketing Agency. 
    A student is interested in: "${interests}". 
    Based on this, recommend ONE of the following courses and explain why:
    - Shopify Dropshipping
    - Digital Marketing
    - Tiktok Monetization
    - Web Development
    - Youtube Monetization
    
    Provide your response in JSON format:
    {
      "recommendedCourse": "Course Name",
      "reason": "Short explanation (2-3 sentences)"
    }`,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
}
