const callApi = async (type, input, sourceLang, targetLang) => {
    let lastError;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type, input, sourceLang, targetLang }),
            });

            // If response status is not OK (e.g., 4xx, 5xx)
            if (!response.ok) {
                const status = response.status;
                let message;

                // Clone the response to safely read the body, as it can only be consumed once.
                const clonedResponse = response.clone(); 

                try {
                    // Try reading error body as JSON first
                    const errorBody = await response.json();
                    message = errorBody.error || `HTTP error! Status: ${status} - Details unavailable.`;
                } catch (e) {
                    // If JSON parsing fails (e.g., received plain text/HTML error page), read as text.
                    try {
                        const errorText = await clonedResponse.text();
                        message = `Server Error (${status}): ${errorText.substring(0, 50)}...`;
                        console.error("Non-JSON Error Body Received:", errorText);
                    } catch (readError) {
                        message = `Server Error (${status}): Could not read error body.`;
                    }
                }
                
                // Retry for Overload/Rate Limit errors
                if (status === 503 || status === 429) {
                    lastError = new Error(message);
                    const waitTime = 2 ** i * 1000; 
                    console.warn(`Attempt ${i + 1} failed with status ${status}. Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue; // Retry
                }

                // For all other errors, throw immediately
                throw new Error(message);
            }

            // If response.ok, return the JSON data
            const data = await response.json();
            return data;
            
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${i + 1} failed (Fetch/Network/Other Error):`, error);
            if (i < MAX_RETRIES - 1) { 
                await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
            }
        }
    }

    throw lastError || new Error("API request failed after multiple retries. Check server logs.");
};

export const convertCode = async (type, input, sourceLang = '', targetLang = '') => {
    const apiResponse = await callApi(type, input, sourceLang, targetLang);
    const rawText = apiResponse.text; 

    // Specific handler for 'css-framework' type which expects JSON in the text field
    if (type === 'css-framework') {
        // Strip backticks for JSON parsing
        let text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            // Safely attempt to parse the JSON
            return JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error (AI Response):", e.message);

            // Return a safe error structure for CssFrameworkConverter.jsx
            return {
                error: "The AI did not return valid JSON. Please try again or simplify the CSS.",
                rawResponse: rawText,
                analysis: "The AI response could not be processed due to invalid formatting.",
                conversions: []
            };
        }
    }
    
    // For other types, return the structure from the backend
    return apiResponse;
};
