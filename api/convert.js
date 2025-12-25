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
    if (targetLang === 'tailwind') {
      // Tailwind specific: Split by selectors for the UI cards
      systemMessage = `You are a CSS to Tailwind converter. Return strictly valid JSON: { "conversions": [{ "selector": "name", "tailwindClasses": "class names" }] }. No markdown.`;
      userMessage = `Convert this CSS to Tailwind:\n\n${input}`;
    } else {
      // Bootstrap, SASS, LESS: Return raw code block
      systemMessage = `You are a CSS to ${targetLang} converter. Output ONLY the raw converted code. No markdown backticks. No explanations.`;
      userMessage = `Convert this CSS to ${targetLang}:\n\n${input}`;
    }
  }
  else if (type === 'regex') {
    systemMessage = "You are a Regular Expression generator. Return ONLY the raw regex pattern. No markdown, no explanations.";
    userMessage = `Create a regex for this requirement:\n\n${input}`;
  }
  else if (type === 'sql') {
    systemMessage = "You are a SQL query builder. Return ONLY the raw SQL query. No markdown, no explanations.";
    userMessage = `Dialect: ${targetLang || 'Standard SQL'}\nRequirement: ${input}`;
  }
  else if (type === 'json') {
    systemMessage = "You are a JSON validator and formatter. Repair any syntax errors, remove comments if present, and format the JSON. Return ONLY the raw valid JSON string.";
    userMessage = `Fix and format this JSON:\n\n${input}`;
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
    const codeBlockMatch = text.match(/```(?:[a-z]+)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    } else {
      text = text.replace(/^```[a-z]*\s*|```$/g, '').trim();
    }
    
    let finalResponse = {};
    
    // FORMING RESPONSES
    if (type === 'css-framework') {
      if (targetLang === 'tailwind') {
        try {
          finalResponse = JSON.parse(text);
        } catch (e) {
          // Fallback for partial JSON matches
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try { finalResponse = JSON.parse(jsonMatch[0]); }
            catch (err) { throw new Error("AI did not return valid JSON"); }
          } else {
            throw new Error("AI did not return valid JSON");
          }
        }
      } else {
        // For Bootstrap/SASS/LESS, treating it like a normal conversion
        finalResponse = { convertedCode: text };
      }
    }
    // Handle text-based outputs (Converter, Generator, Regex, SQL, JSON)
    else if (['converter', 'generator', 'regex', 'sql', 'json'].includes(type)) {
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