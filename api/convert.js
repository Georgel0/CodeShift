import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "GEMINI_API_KEY"; // Ensure this is securely managed
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper for retry delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function convertCode(type, input, sourceLang, targetLang) {
  let prompt = "";

  // Optimized Low-Resource Prompts
  if (type === 'converter') {
    
    prompt = `Convert this ${sourceLang} code to ${targetLang}. Return ONLY the raw code string. No markdown formatting (e.g., \`\`\`), no comments, no explanations. Code: \n\n${input}`;
  } 
  else if (type === 'analysis') {
    
    prompt = `Analyze this code. Return a conciese and strict explanation of it that is well understandable. No intro/outro text. Code: \n\n${input}`;
  } 
  else if (type === 'css-framework') {
  
    prompt = `Convert this CSS to ${targetLang}. Return strictly a JSON object with this format: { "conversions": [{ "selector": "original_selector_name", "tailwindClasses": "converted_classes_only" }] }. Do NOT include explanations. Do NOT include any other text. CSS Input: \n\n${input}`;
  }

  // Retry Logic for 503 Errors
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Return structured data for CSS Frameworks
      if (type === 'css-framework') {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("JSON Parse Error", e);
          
          return { error: "Failed to parse AI response as JSON.", rawResponse: text, conversions: [] };
        }
      }
      
      // For converter and analysis, return the raw text without aggressive stripping.
      if (type === 'converter') {
        return { convertedCode: text.trim() }; 
      }

      if (type === 'analysis') {
        return { analysis: text.trim() };
      }
      
      // Fallback
      return { text: text.trim() };

    } catch (error) {
      // Check for Overload/503 errors
      const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
      
      if (isOverloaded && attempt < maxRetries - 1) {
        attempt++;
        const waitTime = 1000 * Math.pow(2, attempt);
        console.warn(`Model overloaded (503). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue; // Retry the loop
      }
      
      throw error;
    }
  }
}