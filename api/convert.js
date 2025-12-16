import Groq from "groq-sdk";

export default async function handler(req, res) {
  // 1. Basic Setup
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Server Error: GROQ_API_KEY is missing." });
  }

  const { type, input, sourceLang, targetLang } = req.body;

  // 2. Initialize Groq
  const groq = new Groq({ apiKey: API_KEY });

  // 3. Construct the Prompt
  let systemMessage = "";
  let userMessage = "";

  if (type === 'converter') {
    systemMessage = "You are a code conversion engine. Output ONLY the raw code string. Do not use Markdown backticks (```). Do not add explanations. Do not add comments unless they existed in the source.";
    userMessage = `Convert this ${sourceLang} code to ${targetLang}:\n\n${input}`;
  } 
  else if (type === 'analysis') {
    systemMessage = "You are a senior code reviewer. Analyze the code concisely. Use HTML formatting (<br>, <strong>) for readability if needed, but do not use Markdown.";
    userMessage = `Analyze this code:\n\n${input}`;
  } 
  else if (type === 'css-framework') {
    systemMessage = `You are a CSS to Framework converter. You must return strictly valid JSON. 
    The format must be: { "conversions": [{ "selector": "name", "tailwindClasses": "class names" }] }. 
    Do not output markdown or backticks.`;
    userMessage = `Convert this CSS to ${targetLang}:\n\n${input}`;
  }

  try {
    // 4. Call the API (Llama 3 via Groq)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile", // Powerful, fast, and currently free
      temperature: 0.1, // Low temperature for consistent code results
    });

    let text = completion.choices[0]?.message?.content || "";

    // 5. Clean and Format the Output
    // Strip markdown if the AI adds it despite instructions
    text = text.replace(/^```json/g, '').replace(/^```/g, '').trim();

    let finalResponse = {};

    if (type === 'css-framework') {
      try {
        finalResponse = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error", e);
        // Fallback: try to find JSON object inside text if it failed
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { finalResponse = JSON.parse(jsonMatch[0]); }
            catch(err) { throw new Error("AI did not return valid JSON"); }
        } else {
            throw new Error("AI did not return valid JSON");
        }
      }
    } else if (type === 'converter') {
      finalResponse = { convertedCode: text }; 
    } else if (type === 'analysis') {
      finalResponse = { analysis: text };
    }

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({ error: "AI Processing Failed: " + error.message });
  }
}
