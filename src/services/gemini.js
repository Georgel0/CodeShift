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

            // Check if the HTTP response was successful.
            if (!response.ok) {
                const status = response.status;
                let message;

                // Try to read the error body as JSON first, if not, read as text.
                try {
                    const errorBody = await response.json();
                    message = errorBody.error || `HTTP error! Status: ${status} - Details unavailable.`;
                } catch (e) {
                    // If JSON.parse fails here (e.g., it got "A server e..." plain text), 
                    // read the body as a string.
                    const errorText = await response.text();
                    message = `Server Error (${status}): ${errorText.substring(0, 50)}...`;
                    console.error("Non-JSON Error Body Received:", errorText);
                }
                
                // If it's a 503 (overloaded) or 429 (rate limit), retry.
                if (status === 503 || status === 429) {
                    lastError = new Error(message);
                    const waitTime = 2 ** i * 1000; // Exponential Backoff: 1s, 2s, 4s
                    console.warn(`Attempt ${i + 1} failed with status ${status}. Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue; // Go to the next loop iteration (retry)
                }

                // For all other errors (like 500), throw immediately
                throw new Error(message);
            }

            // If response.ok, safely return the JSON data
            const data = await response.json();
            return data;
            
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${i + 1} failed (Fetch/Network Error):`, error);
            if (i < 2) { // Wait before retrying, except after the last attempt
                await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
            }
        }
    }
    // If all retries fail, throw the last error
    throw lastError || new Error("API request failed after multiple retries. Check Vercel logs for 500 error details.");
};

export const convertCode = async (type, input, sourceLang = '', targetLang = '') => {
    // This call handles the 500 error from the serverless function
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
            console.error("JSON Parse Error (AI Response):", e.message);

            // Return a safe error structure that CssFrameworkConverter.jsx expects
            return {
                error: "The AI did not return valid JSON. Please try again or simplify the CSS.",
                rawResponse: rawText,
                analysis: "The AI response could not be processed due to invalid formatting.",
                conversions: [] // Essential: Ensure the 'conversions' array exists to prevent a crash in the UI
            };
        }
    }
// For other types, return the structure from the backend
    return apiResponse;
};