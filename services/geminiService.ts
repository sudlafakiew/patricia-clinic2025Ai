import { GoogleGenAI } from "@google/genai";
import { Service } from "../types";

// Read from Vite's runtime env first, fall back to process.env for other setups
const runtimeEnv: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
const apiKey = (runtimeEnv.VITE_GEMINI_API_KEY as string) || process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
    ai = null;
  }
}

export const generateConsultationPlan = async (
  symptoms: string,
  availableServices: Service[],
  customerName: string
): Promise<{ recommendation: string; recommendedServices: string[] }> => {
  if (!apiKey || !ai) {
    console.error("❌ Gemini API Key not configured. Please set VITE_GEMINI_API_KEY in .env.local");
    return {
      recommendation: "⚠️ Gemini API ยังไม่ได้ตั้งค่า\n\nกรุณาดำเนินการตั้งค่า:\n1. สร้างไฟล์ .env.local\n2. เพิ่ม: VITE_GEMINI_API_KEY=your-key-here\n3. รีสตาร์ท dev server\n\n(Please configure API Key in .env.local)",
      recommendedServices: []
    };
  }

  const serviceList = availableServices.map(s => `- ${s.name} (${s.category}): ${s.price} THB`).join('\n');

  const prompt = `
    Act as a professional beauty clinic consultant.
    Customer Name: ${customerName}
    Customer Concerns/Desires: "${symptoms}"

    Available Services Menu:
    ${serviceList}

    Task:
    1. Analyze the customer's concern.
    2. Recommend 1-3 most suitable services from the menu.
    3. Write a polite, professional, and persuasive consultation note in Thai language explaining why these treatments are good for them.
    4. Return the response in JSON format.

    Response Format (JSON):
    {
      "recommendation": "The consultation note in Thai...",
      "recommendedServices": ["Exact Name of Service 1", "Exact Name of Service 2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      recommendation: `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI:\n\n${errorMsg}\n\n(Error connecting to AI: ${errorMsg})`,
      recommendedServices: []
    };
  }
};

export const generateServiceImage = async (serviceName: string, category: string): Promise<string | null> => {
  if (!apiKey || !ai) {
    console.warn("⚠️ Gemini API Key not configured. Image generation skipped.");
    return null;
  }

  const prompt = `A professional, photorealistic, high-quality aesthetic clinic promotional image for a service called "${serviceName}" (Category: ${category}). 
  The image should be clean, minimalist, soft lighting, spa-like atmosphere, and reassuring. 
  Focus on the result or the feeling of the treatment. 
  Do not include text in the image. Square aspect ratio.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  } catch (error: any) {
    // Parse error for better user messaging
    const errorCode = error?.status || error?.code;
    const errorMsg = error?.message || String(error);
    
    if (errorCode === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMsg.includes('quota') || errorMsg.includes('Quota exceeded')) {
      console.error("❌ Gemini Image Gen Error: Quota Exceeded - Free tier limit reached");
      console.error("Details:", {
        status: errorCode,
        message: errorMsg,
        timestamp: new Date().toISOString()
      });
      return null;
    }
    
    if (errorCode === 401 || errorCode === 'UNAUTHENTICATED' || errorMsg.includes('invalid') || errorMsg.includes('authentication')) {
      console.error("❌ Gemini Image Gen Error: Invalid API Key");
      return null;
    }
    
    console.error("❌ Gemini Image Gen Error:", error);
    return null;
  }
};