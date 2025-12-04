// --- File: api/convert.js (FINAL, STABLE VERSION) ---
import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel securely loads environment variables without the VITE_ prefix 
const API_KEY = process.env.GEMINI_API_KEY;

// Simplified Schema Definition (embedded in the prompt)
const SIMPLIFIED_SCHEMA = `{
  "analysis": "A concise 4-sentence summary of the conversion, including complexities and design decisions.",
  "conversions": [
    {
      "selector": ".card",
      "tailwindClasses": "bg-white p-4 shadow-lg",
      "explanation": "Added background, padding, and box shadow."
    }
  ]
}`;


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { type, code } = req.body;
  
  // 1. Initialize genAI and check for API key
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const modelName = "gemini-2.5-flash"; 
  let systemInstruction = "";
  let mimeType = "text/plain"; 
  
  if (type === 'css-to-tailwind') {
    systemInstruction = `
      You are an expert CSS to Tailwind converter. 
      Your entire output must be a single, valid JSON object, and nothing else.
      You must strictly follow this simplified schema: ${SIMPLIFIED_SCHEMA}
      
      - The output must be valid JSON, without any surrounding markdown (e.g., \`\`\`json).
      - The 'analysis' field must be a brief summary of the overall conversion.
      - The 'conversions' array must contain an object for every CSS selector/block you convert.
    `;
    mimeType = "application/json";
  } else {
    systemInstruction = `Convert the following code based on the request: ${type}. Return plain text.`;
    mimeType = "text/plain";
  }
  
  try {
    // 2. Initialize model with system instruction (cleaner practice)
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input Code:\n${code}` }] }
      ],
      // 3. CRITICAL: Pass *only* the mimeType in generationConfig. 
      // The system instruction is already in the model object.
      generationConfig: {
        responseMimeType: mimeType, 
      } 
    });
    
    // FIX 1: Safely access the text property
    const rawText = result?.response?.text;
    
    if (!rawText) {
      const finishReason = result?.response?.candidates?.[0]?.finishReason;
      let errorMessage = "Gemini returned an empty response. ";
      if (finishReason) {
          errorMessage += `Content was blocked with reason: ${finishReason}.`;
      } else {
          errorMessage += "The model failed to generate content or returned an unexpected structure.";
      }
      throw new Error(errorMessage);
    }
    
    // FIX 2: Explicitly cast to String() before calling .trim()
    const responseText = String(rawText).trim();
    
    let finalResultObject;
    try {
        // FIX 3: Safety check on JSON parsing
        finalResultObject = JSON.parse(responseText);
    } catch(parseError) {
        // This catch block handles the error you just received.
        throw new Error(`Failed to parse JSON response from AI. The AI responded with: ${responseText.substring(0, 150)}...`);
    }

    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: 'Conversion failed. API Request failed with status 500.',
      details: error.message
    });
  }
}
