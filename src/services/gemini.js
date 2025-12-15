export const convertCode = async (type, code, sourceLang = null, targetLang = null) => {
    // Pass languages only if provided (needed for generic and css-framework converters)
    const body = { type, code };
    if (sourceLang) body.sourceLang = sourceLang;
    if (targetLang) body.targetLang = targetLang;
    
    const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    
    // Check if the response was successful 
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
    
    // Safely read the JSON body
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json(); // Only execute .json() if header indicates JSON
    } else {
        // If the content type is missing or not JSON, read it as text
        // This prevents the '.json() on Response' error
        return response.text();
    }
};