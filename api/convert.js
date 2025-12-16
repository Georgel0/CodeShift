
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to strip markdown code fences
const stripCodeFences = (text) => {
    return text.replace(/^```[a-zA-Z]*\s*|```$/g, '').trim();
};

// Main Vercel Serverless Handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check API Key
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Server Error: GEMINI_API_KEY is missing in Vercel Environment Variables." });
  }

  try {
    // Parse the incoming data from the frontend
    const { type, input, sourceLang, targetLang } = req.body;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (type === 'converter') {
      prompt = `Convert this ${sourceLang} code to ${targetLang}. Return ONLY the raw code string. No markdown formatting (e.g., \`\`\`), no comments, no explanations. Code: \n\n${input}`;
    } 
    else if (type === 'analysis') {
      prompt = `Analyze this code. Return a conciese and strict explanation of it that is well understandable. No intro/outro text. Code: \n\n${input}`;
    } 
    else if (type === 'css-framework') {
      prompt = `Convert this CSS to ${targetLang}. Return strictly a JSON object with this format: { "conversions": [{ "selector": "original_selector_name", "tailwindClasses": "converted_classes_only" }] }. Do NOT include explanations. Do NOT include any other text. CSS Input: \n\n${input}`;
    }

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Process output based on type
    let finalResponse = {};

    if (type === 'css-framework') {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        finalResponse = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error", e);
        return res.status(500).json({ error: "Failed to parse AI response as JSON.", rawResponse: text });
      }
    } else if (type === 'converter') {
      finalResponse = { convertedCode: stripCodeFences(text) }; 
    } else if (type === 'analysis') {
      finalResponse = { analysis: stripCodeFences(text) };
    } else {
      finalResponse = { text: text.trim() };
    }

    // Send success response back to frontend
    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
