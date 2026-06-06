import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeTimetable = async (base64Image: string) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "Analyze this timetable image and return a structured JSON object. The JSON should have a 'days' object where keys are days of the week (Monday, Tuesday, etc.) and values are arrays of objects with 'time', 'subject', and 'location'." },
        { inlineData: { mimeType: "image/png", data: base64Image } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          days: {
            type: Type.OBJECT,
            additionalProperties: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  location: { type: Type.STRING }
                },
                required: ["time", "subject"]
              }
            }
          }
        },
        required: ["days"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const processTodoVoice = async (text: string) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Extract a clear to-do task from this text: "${text}". Return only the task text.`
  });
  return response.text.trim();
};

export const chatWithAI = async (message: string, base64Image?: string) => {
  const model = "gemini-3-flash-preview";
  const parts: any[] = [{ text: message }];
  if (base64Image) {
    parts.push({ inlineData: { mimeType: "image/png", data: base64Image } });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts }
  });
  return response.text;
};

export const generateNotes = async (content: string) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Generate comprehensive student notes from this content: "${content}". Include a summary and a list of important questions. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          questions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "questions"]
      }
    }
  });
  return JSON.parse(response.text);
};
