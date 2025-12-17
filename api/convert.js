import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Server Error: GROQ_API_KEY is missing." });
  }

  const { type, input, sourceLang, targetLang } = req.body;
  const groq = new Groq({ apiKey: API_KEY });

  let systemMessage = "";
  let userMessage = "";
  
  // DEFINING PROMPTS
  if (type === 'converter') {
    systemMessage = "You are a code conversion engine. Output ONLY the raw code string. No markdown backticks. No explanations.";
    userMessage = `Convert this ${sourceLang} code to ${targetLang}:\n\n${input}`;
  } 
  else if (type === 'generator') { 
    systemMessage = "You are an expert code generator. Return ONLY the raw code. Do not use Markdown backticks. Do not add explanations or wrapper text.";
    userMessage = `Write code for the following request:\n\n${input}`;
  }
  else if (type === 'analysis') {
    systemMessage = "You are a senior code reviewer. Analyze the code concisely. Use HTML formatting (<br>, <strong>) for readability if needed, but do not use Markdown.";
    userMessage = `Analyze this code:\n\n${input}`;
  } 
  else if (type === 'css-framework') {
    systemMessage = `You are a CSS to Framework converter. Return strictly valid JSON: { "conversions": [{ "selector": "name", "tailwindClasses": "class names" }] }. No markdown.`;
    userMessage = `Convert this CSS to ${targetLang}:\n\n${input}`;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    let text = completion.choices[0]?.message?.content || "";
    // Strip markdown formatting
    text = text.replace(/^```[a-z]*\s*|```$/g, '').trim();

    let finalResponse = {};

    // FORMING RESPONSES
    if (type === 'css-framework') {
      try {
        finalResponse = JSON.parse(text);
      } catch (e) {
        // Fallback for partial JSON matches
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { finalResponse = JSON.parse(jsonMatch[0]); }
            catch(err) { throw new Error("AI did not return valid JSON"); }
        } else {
            throw new Error("AI did not return valid JSON");
        }
      }
    } 
    // Handle both converter and generator with the same structure
    else if (type === 'converter' || type === 'generator') {
      finalResponse = { convertedCode: text }; 
    } 
    else if (type === 'analysis') {
      finalResponse = { analysis: text };
    }

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({ error: "AI Processing Failed: " + error.message });
  }
}