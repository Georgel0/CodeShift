import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { type, code } = req.body;
  
  // Initialize genAI and check for API key
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured. Check Vercel environment variables.' });
  }
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  const modelName = "gemini-2.5-flash"; 
  
  let systemInstruction = "";
  
  // Define the target JSON structure 
  const TARGET_JSON_STRUCTURE = `{
    "analysis": "string",
    "conversions": [
      {
        "selector": "string",
        "tailwindClasses": "string"
      }
    ]
  }`;

  if (type === 'css-to-tailwind') {
    systemInstruction = `
      You are an expert CSS to Tailwind converter.
      Return a JSON object matching this structure: ${TARGET_JSON_STRUCTURE}.
      - 'analysis': Summary of the conversion.
      - 'conversions': Array of objects for each CSS selector.
    `;
  } else {
    systemInstruction = `Convert the following code based on the request: ${type}. Return plain text.`;
  }
  
  try {
    // Configure generationConfig for JSON
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: {
            //forces the model to output strictly JSON
            responseMimeType: "application/json" 
        }
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Input CSS Code to convert:\n${code}` }] }
      ]
    });
    
    const rawText = result?.response?.text();
    
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }
    
    //removes ```json, ```, and trims whitespace
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    
    let finalResultObject;
    try {
        finalResultObject = JSON.parse(cleanText);
    } catch(parseError) {
        console.error("JSON Parse Error. Raw text was:", rawText);
        throw new Error("Failed to parse AI response.");
    }

    res.status(200).json(finalResultObject);
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: 'Conversion failed.',
      details: error.message
    });
  }
}
