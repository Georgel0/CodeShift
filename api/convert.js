import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, code } = req.body;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured.' });
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const modelName = "gemini-2.0-flash";

  let systemInstruction = "";
  let userPrompt = `Code to convert:\n${code}`;

  // Defining structures
  const CSS_JSON_STRUCTURE = `{
    "analysis": "string",
    "conversions": [{ "selector": "string", "tailwindClasses": "string", "explanation": "string" }]
  }`;

  const JS_TS_JSON_STRUCTURE = `{
    "convertedCode": "string",
    "explanation": "string"
  }`;

  // Selecting prompts
  if (type === 'css-to-tailwind') {
    systemInstruction = `
      You are an expert CSS to Tailwind converter.
      Return a JSON object matching this structure: ${CSS_JSON_STRUCTURE}.
      - 'analysis': Summary of the conversion.
      - 'conversions': Array of objects for each CSS selector.
      - 'explanation': Brief explanation for the conversion.
    `;
    userPrompt = `Input CSS Code to convert:\n${code}`;

  } else if (type === 'ts-to-js') {
    systemInstruction = `
      You are an expert TypeScript developer. Convert the input TypeScript code to modern JavaScript (ES6+).
      - Remove type annotations, interfaces, and specific TS syntax.
      - Return a JSON object matching this structure: ${JS_TS_JSON_STRUCTURE}.
      - "convertedCode": The resulting JavaScript code.
      - "explanation": Brief summary of what was stripped or changed.
    `;
    userPrompt = `Input TypeScript Code to convert to JavaScript:\n${code}`;

  } else if (type === 'js-to-ts') {
    systemInstruction = `
      You are an expert TypeScript developer. Convert the input JavaScript code to TypeScript.
      - Infer types where possible (avoid 'any' if easy to determine). 
      - Define interfaces for objects if helpful.
      - Return a JSON object matching this structure: ${JS_TS_JSON_STRUCTURE}.
      - "convertedCode": The resulting TypeScript code.
      - "explanation": Brief summary of types added.
    `;
    userPrompt = `Input JavaScript Code to convert to TypeScript:\n${code}`;

  } else {
    // Fallback for other future modules
    systemInstruction = `Analyze the code. Return a JSON object: { "result": "output string" }`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }]
    });

    const rawText = result?.response?.text();

    if (!rawText) throw new Error("Gemini returned an empty response.");

    // Clean up markdown code blocks if the model includes them
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    const finalResultObject = JSON.parse(cleanText);

    res.status(200).json(finalResultObject);

  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: 'Conversion failed.', details: error.message });
  }
}
