import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel loads environment variables from process.env
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const {yb, type, code } = req.body;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }
  
  // Setup Instructions and Schema based on type
  let systemInstructionText = "";
  let generationConfig = {
    responseMimeType: "application/json"
  };
  
  if (type === 'css-to-tailwind') {
    systemInstructionText = `
      You are an expert CSS to Tailwind converter. 
      Your only output must be a valid, clean JSON object that strictly adheres to the provided schema.
      Analyze the provided CSS, including complex selectors, var(), calc(), and modern color functions, and provide the analysis and conversions.
      If a CSS value cannot be directly mapped, use Tailwind's arbitrary value syntax (e.g., [width:calc(100%-1rem)]).
    `;
    // Attach the schema to the generation config
    generationConfig.responseSchema = cssToTailwindSchema;
  } else {
    systemInstructionText = `Convert the following code based on the request: ${type}. Return plain text.`;
    // Remove JSON enforcement for other types if they aren't structured
    generationConfig.responseMimeType = "text/plain"; 
  }
  
  try {
    // Initialize the model WITH the system instruction here
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstructionText 
    });

    // Generate content using the correct property: 'generationConfig' 
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input Code:\n${code}` }] }
      ],
      generationConfig: generationConfig 
    });
    
    const responseText = result.response.text().trim();
    
    if (!responseText) {
      throw new Error("Gemini returned an empty response text.");
    }
    
    // Parse the JSON string into a JavaScript object
    constfinalResultObject = JSON.parse(responseText);
    
    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: 'Gemini conversion failed due to an internal API error.',
      details: error.message
    });
  }
}
