// --- File: ../services/gemini.js ---

export const convertCode = async (type, code) => {
    const response = await fetch('/api/convert', { // Assuming this is your endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, code }),
    });

    // 1. Check if the response was successful (HTTP status 200-299)
    if (!response.ok) {
        // Attempt to read the error message from the body first
        let errorBody;
        try {
            // Read response as text first, as error responses might not be JSON
            errorBody = await response.text();
        } catch (e) {
            // Ignore error reading body
        }
        
        // Throw a helpful error message
        throw new Error(`API Request failed with status ${response.status}: ${errorBody || 'No response body provided.'}`);
    }

    // 2. Safely read the JSON body
    // This is the CRITICAL change: handle the potential for an empty response body
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json(); // Only execute .json() if header indicates JSON
    } else {
        // If the content type is missing or not JSON, read it as text
        // This prevents the '.json() on Response' error
        return response.text(); 
    }
};
