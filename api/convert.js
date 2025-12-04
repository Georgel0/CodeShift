// api/convert.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

// Check if API_KEY is present before initializing
let genAI;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// Schema Definition
const SIMPLIFIED_SCHEMA = `{
  "analysis": "A concise 4-sentence summary of the conversion, including complexities and design decisions.",
  "conversions": [
    {
      "selector": ".card",
      "tailwindClasses": "bg-white p-4 shadow-lg",
      "explanation": "Added background, padding, and box shadow."
    },
    // ... more conversion objects
  ]
}`;


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { type, code } = req.body;
  
  if (!API_KEY || !genAI) {
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }

  // Use a capable model for complex conversions
  const modelName = "gemini-2.5-flash"; // Assuming this is the model you switched to

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
      generationConfig: {
        responseMimeType: mimeType, 
      } 
    });
    
    const responseText = result.response.text.trim();
    
    if (!responseText) {
      throw new Error("Gemini returned an empty response text.");
    }
    
    // Parse the JSON string into a JavaScript object
    const finalResultObject = JSON.parse(responseText);
    
    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: 'Gemini conversion failed due to an internal API error.',
      details: error.message
    });
  }
}
