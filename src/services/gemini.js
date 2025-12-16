const callApi = async (type, input, sourceLang, targetLang) => {
    
    let lastError;
    for (let i = 0; i < 3; i++) { // Try up to 3 times
        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type, input, sourceLang, targetLang }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                const status = response.status;
                const message = errorBody.error || `HTTP error! Status: ${status}`;
                
                // If it's a 503 or 429, retry. Otherwise, throw the error immediately.
                if (status === 503 || status === 429) {
                    lastError = new Error(message);
                    console.warn(`Attempt ${i + 1} failed with status ${status}. Retrying in ${2 ** i * 100}ms...`);
                    await new Promise(resolve => setTimeout(resolve, 2 ** i * 100));
                    continue; // Go to the next loop iteration (retry)
                }

                throw new Error(message);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i < 2) { // Wait before retrying, except after the last attempt
                await new Promise(resolve => setTimeout(resolve, 2 ** i * 100));
            }
        }
    }
    // If all retries fail, throw the last error
    throw lastError || new Error("API request failed after multiple retries.");
};

export const convertCode = async (type, input, sourceLang = '', targetLang = '') => {
    const apiResponse = await callApi(type, input, sourceLang, targetLang);
    const rawText = apiResponse.text; 

    if (type === 'css-framework') {
        // Strip backticks only for JSON parsing
        let text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            // Safely attempt to parse the JSON
            return JSON.parse(text);
        } catch (e) {
            // CRITICAL: Catch the parsing error and return a safe object instead of crashing the function
            console.error("JSON Parse Error:", e.message);
            console.error("Raw text that failed to parse:", rawText);

            // Return a safe error structure that CssFrameworkConverter.jsx expects
            return {
                error: "The AI did not return valid JSON. Please try again or simplify the CSS.",
                rawResponse: rawText,
                analysis: "The AI response could not be processed due to invalid formatting.",
                conversions: [] // Essential: Ensure the 'conversions' array exists to prevent a crash in the UI
            };
        }
    }
    return apiResponse;
};
