import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel securely loads environment variables without the VITE_ prefix 
const API_KEY = process.env.GEMINI_API_KEY;

// NOTE: SIMPLIFIED_SCHEMA variable has been removed as requested. 
// The structure is defined directly in the system instruction.

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
  
  // Define the target JSON structure as a constant string for clarity in the prompt
  const TARGET_JSON_STRUCTURE = `{
    "analysis": "A brief summary of the overall conversion, highlighting key challenges or decisions.",
    "conversions": [
      {
        "selector": ".card",
        "tailwindClasses": "bg-white p-4 shadow-lg",
        "explanation": "A concise explanation of the classes used."
      }
    ]
  }`;

  if (type === 'css-to-tailwind') {
    // CRITICAL CHANGE: Clear, direct instruction to return ONLY the raw JSON object, no markdown.
    systemInstruction = `
      You are an expert CSS to Tailwind converter. 
      Your ONLY output must be a valid, single JSON object. DO NOT wrap it in \`\`\`json or any other characters.
      
      You must strictly adhere to the following simple structure:
      
      ${TARGET_JSON_STRUCTURE}
      
      - The 'analysis' field is the overall summary of the conversion.
      - Each object in the 'conversions' array must correspond to one CSS selector/block.
    `;
    
  } else {
    // For any other types, just convert as plain text
    systemInstruction = `Convert the following code based on the request: ${type}. Return plain text.`;
  }
  
  try {
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
    });

    // We do NOT include responseMimeType or responseSchema to avoid the bug, 
    // relying completely on the system instruction.
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input CSS Code to convert:\n${code}` }] }
      ],
      generationConfig: {
        // Empty config to bypass the SDK bug
      } 
    });
    
    // Safely access the text property
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
    
    // FIX 1 & 2: Explicitly cast to String() and trim to prevent "is not a function" error
    const responseText = String(rawText).trim();
    
    let finalResultObject;
    try {
        // FIX 3: Safety check on JSON parsing
        finalResultObject = JSON.parse(responseText);
    } catch(parseError) {
        // This handles the error where the AI returns non-JSON data (like the function definition)
        // By relying purely on prompt engineering, the AI is less likely to return
        // a malformed object due to SDK intervention.
        throw new Error(`Failed to parse JSON response from AI. The AI responded with non-JSON data starting with: ${responseText.substring(0, 150)}...`);
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
