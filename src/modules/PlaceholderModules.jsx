import { useState, useEffect } from 'react';
import { convertCode } from '../services/gemini';
import { saveHistory } from '../services/firebase';
import './Modules.css';

export default function PlaceholderModule({ title, icon, type, onLoadData }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load from history if data is available
  useEffect(() => {
    if (onLoadData) {
      setInput(onLoadData.input || ''); 
      setOutput(onLoadData.fullOutput || null);
    } else {
      setInput('');
      setOutput(null);
    }
  }, [onLoadData]);
  
  // Only enable the conversion feature for 'generator'
  const isConverter = type === 'generator';
  
  const handleConvert = async () => {
    if (!input.trim() || !isConverter) return;
    setLoading(true);
    setOutput(null);

    try {
      // Use the 'generator' type for the API call
      const result = await convertCode(type, input); 

      // Check for the expected output structure from convert.js (Generator)
      if (result && result.convertedCode) {
          setOutput(result);
          await saveHistory(type, input, result);
      } else {
           console.error("Unexpected structure:", result);
           throw new Error("AI returned an unexpected structure.");
      }

    } catch (error) {
      alert(`Operation failed. Error: ${error.message}`);
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>{title}</h1>
        {isConverter && <p className="module-description">Describe the code you want to generate.</p>}
      </header>
      <div className="converter-grid">
        {/* Input Panel */}
        <div className="panel input-panel">
          <h3>Input</h3>
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={isConverter ? "Generate a Python script to fetch the weather..." : "This module is coming soon!"}
            disabled={!isConverter}
          />
          {isConverter && (
            <button 
              className="primary-button action-btn" 
              onClick={handleConvert} 
              disabled={loading || !input.trim()}
            >
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
          )}
        </div>

        {/* Output Panel */}
        <div className="panel output-panel">
          <h3>Output & Notes</h3>
          {output && isConverter ? (
            <div className="results-container">
              {/* Generated Code */}
              <div className="selector-card" style={{ marginTop: 0 }}>
                <div className="tailwind-code">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {output.convertedCode}
                  </pre>
                  <button className="primary-button copy-btn" onClick={() => navigator.clipboard.writeText(output.convertedCode)}>
                    Copy
                  </button>
                </div>
              </div>
              
              {/* Explanation/Notes */}
              {output.explanation && (
                <div className="ai-summary" style={{ marginTop: '1rem' }}>
                  <strong>Usage Notes:</strong>
                  <p>{output.explanation}</p>
                </div>
              )}
            </div>
          ) : (
             <div className="placeholder-text" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading 
                ? 'AI is working...' 
                : isConverter 
                  ? 'Generated code will appear here.'
                  : (
                    <div style={{ textAlign: 'center' }}>
                      <i className={icon} style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }}></i>
                      <h2>Coming Soon</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>This feature is currently under development.</p>
                    </div>
                  )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}