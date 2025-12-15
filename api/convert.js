import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, code, sourceLang, targetLang } = req.body;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Server key not configured.' });
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const modelName = "gemini-2.5-flash";

  let systemInstruction = "";
  let userPrompt = `Input Code:\n${code}`;
  
  // JSON structures
  const CONVERTER_JSON_STRUCTURE = `{
    "convertedCode": "string"
  }`;
  
  const ANALYSIS_JSON_STRUCTURE = `{
    "analysis": "string (A detailed, multi-paragraph explanation using Markdown for readability.)"
  }`;
  
  const GENERATOR_JSON_STRUCTURE = `{
    "convertedCode": "string",
    "explanation": "string (Brief usage instructions.)"
  }`;

  // GENERIC CONVERTER
  if (type === 'converter') {
    systemInstruction = `
      You are an expert Polyglot Programmer. 
      Convert the input code from ${sourceLang} to ${targetLang}.
      
      Rules:
      1. Return valid, idiomatic ${targetLang} code.
      2. Return a JSON object matching this structure: ${CONVERTER_JSON_STRUCTURE}.
      3. Do NOT include explanations, comments, or any extra text outside the JSON.
    `;
    userPrompt = `Code to convert from ${sourceLang} to ${targetLang}:\n${code}`;
  } 
  // CODE ANALYSIS
  else if (type === 'analysis') {
    systemInstruction = `
      You are a Senior Tech Lead conducting a code review.
      Analyze the provided code in detail.
      
      Rules:
      1. Provide a detailed, multi-paragraph explanation of how the code works, its logic, and potential improvements. Use Markdown formatting (bolding, lists) for readability.
      2. Return a JSON object matching this structure: ${ANALYSIS_JSON_STRUCTURE}.
    `;
    userPrompt = `Code to analyze:\n${code}`;
  }
  // CODE GENERATOR 
  else if (type === 'generator') {
    systemInstruction = `
      Generate code based on the user's request.
      Rules:
      1. Return the generated code and brief usage instructions.
      2. Dont put any comments in the code, any explanetoon needed you will probide in the explenation section from the 3rd rule.
      3. Return a JSON object matching this structure: ${GENERATOR_JSON_STRUCTURE}.
    `;
    userPrompt = `Request: ${code}`;
  }
  else {
    // Fallback for unknown type
    systemInstruction = `Analyze. Return JSON: { "result": "Unknown module type." }`;
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
    res.status(500).json({ error: 'Conversion failed.', details: error.message });
  }
}