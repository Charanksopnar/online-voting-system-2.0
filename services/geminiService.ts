import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert URL to Base64 (for stored images)
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to base64", error);
    return '';
  }
};

export const analyzeFraudRisk = async (votingPattern: any): Promise<{ riskLevel: string; reasoning: string }> => {
  if (!apiKey) return { riskLevel: 'LOW', reasoning: 'AI Service not configured. Defaulting to low risk.' };

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze the following voting pattern for potential fraud:
      ${JSON.stringify(votingPattern)}
      
      Return a JSON object with 'riskLevel' (LOW, MEDIUM, HIGH) and 'reasoning'.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { riskLevel: 'UNKNOWN', reasoning: 'Error connecting to AI service.' };
  }
};

export const extractIdData = async (imageBase64: string, docType: 'AADHAAR' | 'EPIC' = 'AADHAAR'): Promise<any> => {
  if (!apiKey) {
    // Mock for demo if no API key
    return docType === 'AADHAAR'
      ? { name: "John Doe", idNumber: "123456789012" }
      : { name: "John Doe", idNumber: "ABC1234567" };
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = docType === 'AADHAAR'
      ? "Analyze this image of an Aadhaar Card. Extract the Name, Date of Birth (dob in YYYY-MM-DD format), Address (State, District, City), 12-digit Aadhaar Number, and contact details if available (Email, Phone/Mobile). Return JSON: { name, dob, state, district, city, idNumber, email, phone }."
      : "Analyze this image of a Voter ID (EPIC) Card. Extract the Name and the EPIC Number (alphanumeric ID). Return JSON: { name, idNumber }.";

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
};

export const verifyFaceIdentity = async (storedFaceUrl: string, currentFaceBase64: string): Promise<{ match: boolean; confidence: number }> => {
  if (!apiKey) return { match: true, confidence: 0.99 }; // Dev fallback

  try {
    // Convert stored URL to base64 to send to Gemini
    const storedFaceBase64 = await urlToBase64(storedFaceUrl);

    if (!storedFaceBase64) return { match: false, confidence: 0 };

    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a biometric verification AI. 
      Compare these two images. 
      Image 1 is the reference photo of a registered voter.
      Image 2 is the live camera capture of the person attempting to vote.
      
      Do these two images depict the same person?
      Consider facial features, bone structure, and landmarks. Ignore lighting or aging differences.
      
      Return JSON: { "match": boolean, "confidence": number (0-1) }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: storedFaceBase64 } }, // Reference
          { inlineData: { mimeType: 'image/jpeg', data: currentFaceBase64 } }, // Live
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"match": false, "confidence": 0}');
  } catch (error) {
    console.error("Face Verification Error:", error);
    // Fail safe to false in production, but for demo we might log
    return { match: false, confidence: 0 };
  }
};