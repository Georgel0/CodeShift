import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, code, sourceLang, targetLang } = req.body; // Destructure new language params

  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured.' });
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const modelName = "gemini-2.5-flash";

  let systemInstruction = "";
  let userPrompt = `Input Code:\\n${code}`;
  
  // JSON structures
  const CONVERTER_JSON_STRUCTURE = `{\n    \"convertedCode\": \"string\"\n  }`;
  
  const ANALYSIS_JSON_STRUCTURE = `{\n    \"analysis\": \"string (A detailed, multi-paragraph explanation using Markdown for readability.)\"\n  }`;
  
  const GENERATOR_JSON_STRUCTURE = `{\n    \"convertedCode\": \"string\",\n    \"explanation\": \"string (Brief usage instructions.)\"\n  }`;

  // GENERIC CONVERTER 
  if (type === 'converter') {
    if (!sourceLang || !targetLang) {
      return res.status(400).json({ error: 'Source and target languages are required for converter type.' });
    }
    systemInstruction = `
      You are an expert Polyglot Programmer. 
      Convert the input code from ${sourceLang} to ${targetLang}.
      
      Rules:
      1. Return valid, idiomatic ${targetLang} code.
      2. Return a JSON object matching this structure: ${CONVERTER_JSON_STRUCTURE}.
    `;
    userPrompt = `Code to convert from ${sourceLang} to ${targetLang}:\n${code}`;
  }

  else if (type === 'css-tailwind') {

    const CSS_JSON_STRUCTURE = `{\n    \"analysis\": \"string\",\n    \"conversions\": [{ \"selector\": \"string\", \"tailwindClasses\": \"string\", \"explanation\": \"string\" }]\n  }`;
    systemInstruction = `
      You are an expert CSS to Tailwind converter.
      Return a JSON object matching this structure: ${CSS_JSON_STRUCTURE}.
      - 'analysis': Summary of the conversion.
      - 'conversions': Array of objects for each CSS selector.
      - 'explanation': Brief explanation for the conversion.
    `;
    userPrompt = `Input CSS Code to convert:\\n${code}`;
  }
  // CODE ANALYSIS
  else if (type === 'analysis') {
    systemInstruction = `
      You are an expert software engineer. Analyze the provided code for complexity, potential bugs, best practices, and security flaws.
      
      Rules:
      1. Use Markdown for formatting (bolding, lists, headings) to make the analysis highly readable.
      2. Return a JSON object matching this structure: ${ANALYSIS_JSON_STRUCTURE}.
    `;
    userPrompt = `Code to analyze:\\n${code}`;
  }
  // CODE GENERATOR 
  else if (type === 'generator') {
    systemInstruction = `
      You are an expert programmer. Generate code based on the user's request.
      
      Rules:
      1. The generated code MUST be returned in the 'convertedCode' field.
      2. The 'explanation' field MUST contain brief usage instructions or notes.
      3. Do not include any comments in the code.
      4. Return a JSON object matching this structure: ${GENERATOR_JSON_STRUCTURE}.
    `;
    userPrompt = `Request: ${code}`;
  }
  else {
    // Fallback for unknown type
    systemInstruction = `Analyze. Return JSON: { \"result\": \"Unknown module type: ${type}.\" }`;
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

    // Clean up markdown code blocks
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    const finalResultObject = JSON.parse(cleanText);

    res.status(200).json(finalResultObject);

  } catch (error) {
    console.error("Gemini API error:", error);
    const errorMessage = error.message || 'An unknown error occurred during API processing.';
    res.status(500).json({ error: 'Conversion failed.', details: errorMessage });
  }
}