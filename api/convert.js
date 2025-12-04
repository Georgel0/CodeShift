import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { type, code } = req.body;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }
  
  // Initialize genAI here, inside the handler, to ensure it uses the key
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  let systemInstruction = "";
  let responseSchema = {};
  
  if (type === 'css-to-tailwind') {
    systemInstruction = `
      You are an expert CSS to Tailwind converter. 
      Your only output must be a valid, clean JSON object that strictly adheres to the provided schema.
      Analyze the provided CSS, including complex selectors, var(), calc(), and modern color functions, and provide the analysis and conversions.
      If a CSS value cannot be directly mapped, use Tailwind's arbitrary value syntax (e.g., [width:calc(100%-1rem)]).
    `;
    responseSchema = cssToTailwindSchema;
    
  } else {
    systemInstruction = `Convert the following code based on the request: ${type}. Return plain text.`;
  }
  
  try {
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
    
    const rawText = result?.response?.text;
    
    if (!rawText) {
      // Check for blocked content reason
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
    
    // Send the parsed OBJECT directly
    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error in Serverless Function:", error);
    
    // Send a JSON error response in the event of failure
    res.status(500).json({
      error: 'Conversion failed. API Request failed with status 500.',
      // Pass the specific error detail to the client for better debugging
      details: error.message 
    });
  }
}
