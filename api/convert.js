import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel securely loads environment variables without the VITE_ prefix 
const API_KEY = process.env.GEMINI_API_KEY;

// NEW SIMPLIFIED SCHEMA (Embedded in the prompt)
// The analysis is now a top-level field as expected by your component's display logic.
const SIMPLIFIED_SCHEMA = `{
  "analysis": "A brief summary of the overall conversion, highlighting key challenges or decisions.",
  "conversions": [
    {
      "selector": ".card",
      "tailwindClasses": "bg-white p-4 shadow-lg",
      "explanation": "A concise explanation of the Tailwind classes used for this selector."
    },
    // ... more conversion objects
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
  
  if (type === 'css-to-tailwind') {
    // CRITICAL CHANGE: Instruction to force JSON output enclosed in a markdown block
    systemInstruction = `
      You are an expert CSS to Tailwind converter. 
      Your entire output must be a single JSON object wrapped in a markdown code block, starting and ending with \`\`\`json.
      
      You must strictly follow this simplified schema structure: ${SIMPLIFIED_SCHEMA}
      
      - The 'analysis' field is the overall summary.
      - Each item in 'conversions' must contain the original 'selector', the 'tailwindClasses', and a per-selector 'explanation'.
      - DO NOT include any text, notes, or explanations outside of the \`\`\`json block.
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

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input CSS Code to convert:\n${code}` }] }
      ],
      generationConfig: {
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
    
    //cast to String() before calling .trim()
    const responseText = String(rawText).trim();
    
    //Extract JSON from the markdown block using a RegExp
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    
    let jsonString;
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1].trim();
    } else {
      // Fallback: If no markdown block is found, assume the raw text *is* the JSON
      jsonString = responseText;
    }
    
    let finalResultObject;
    try {
        //check on JSON parsing
        finalResultObject = JSON.parse(jsonString);
    } catch(parseError) {
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
