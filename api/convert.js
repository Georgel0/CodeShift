import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel securely loads environment variables without the VITE_ prefix 
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the required structure using a JSON Schema
const cssToTailwindSchema = {
  type: "OBJECT",
  properties: {
    "analysis": {
      "type": "STRING",
      "description": "A concise 4-sentence paragraph describing the conversion process, complexities handled, and any limitations or approximations."
    },
    "conversions": {
      "type": "ARRAY",
      "description": "An array of converted CSS selectors and their Tailwind equivalents.",
      "items": {
        "type": "OBJECT",
        "properties": {
          "selector": {
            "type": "STRING",
            "description": "The original CSS selector (e.g., .card, .btn:hover)."
          },
          "tailwindClasses": {
            "type": "STRING",
            "description": "The complete string of equivalent Tailwind classes, using arbitrary values for non-standard properties."
          },
          "explanation": {
            "type": "STRING",
            "description": "A brief sentence explaining the primary Tailwind classes chosen for this selector."
          }
        },
        "required": ["selector", "tailwindClasses", "explanation"]
      }
    }
  },
  "required": ["analysis", "conversions"]
};

// NOTE: The cleanJsonResponse function is no longer needed because 
// we are using the structured response feature below.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Use correct variable names from the client: type (for promptType) and code (for codeInput)
  const { type, code } = req.body;
  
  if (!API_KEY) {
    // This is a client-side error now, which is better
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }
  
  // Use the model for structured output
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  let systemInstruction = "";
  let responseSchema = {};
  
  if (type === 'css-to-tailwind') {
    // 1. Define the system instruction to set the persona
    systemInstruction = `
      You are an expert CSS to Tailwind converter. 
      Your only output must be a valid, clean JSON object that strictly adheres to the provided schema.
      Analyze the provided CSS, including complex selectors, var(), calc(), and modern color functions, and provide the analysis and conversions.
      If a CSS value cannot be directly mapped, use Tailwind's arbitrary value syntax (e.g., [width:calc(100%-1rem)]).
    `;
    // 2. Assign the schema for structured output
    responseSchema = cssToTailwindSchema;
    
  } else {
    // Fallback for unsupported types
    systemInstruction = `Convert the following code based on the request: ${type}. Return plain text.`;
    // No schema for plain text output
  }
  
  try {
    // Use generateContent with the system instruction and generation config
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input Code:\n${code}` }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });
    
    // When responseMimeType is set to application/json, the result text is guaranteed
    // to be a clean JSON string, which must be parsed into an object.
    const responseText = result.response.text.trim();
    
    // Check for empty response (if API fails or returns no content)
    if (!responseText) {
      throw new Error("Gemini returned an empty response text.");
    }
    
    // Parse the JSON string into a JavaScript object
    const finalResultObject = JSON.parse(responseText);
    
    // 3. CRITICAL FIX: Send the parsed OBJECT directly, not wrapped in { data: ... }
    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error in Serverless Function:", error);
    
    // Send a JSON error response in the event of failure
    res.status(500).json({
      error: 'Gemini conversion failed due to an internal API error.',
      details: error.message
    });
  }
}