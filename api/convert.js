import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel securely loads environment variables without the VITE_ prefix 
const API_KEY = process.env.GEMINI_API_KEY;

// Simplified Schema Definition
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
  
  // Initialize genAI and check for API key *before* using it
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }
  
  // Initialize genAI inside the handler to ensure proper environment access
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Use a capable model for complex conversions
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
    // For any other types, just convert as plain text
    systemInstruction = `Convert the following code based on the request: ${type}. Return plain text.`;
    mimeType = "text/plain";
  }
  
  try {
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input Code:\n${code}` }] }
      ],
      // Use 'generationConfig' for configuration object
      generationConfig: {
        responseMimeType: mimeType, 
        // We rely on the system instruction for the structure
      } 
    });
    
    const rawText = result?.response?.text;
    
    if (!rawText) {
      // Check for blocked content reason, which often causes missing text
      const finishReason = result?.response?.candidates?.[0]?.finishReason;
      
      let errorMessage = "Gemini returned an empty response. ";
      if (finishReason) {
          errorMessage += `Content was blocked with reason: ${finishReason}.`;
      } else {
          errorMessage += "The model failed to generate content or returned an unexpected structure.";
      }
      throw new Error(errorMessage);
    }
    
    const responseText = rawText.trim();
    
    // Parse the JSON string into a JavaScript object
    const finalResultObject = JSON.parse(responseText);
    
    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: 'Conversion failed. API Request failed with status 500.',
      details: error.message
    });
  }
}
