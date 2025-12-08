import { useState, useEffect } from 'react';
import { convertCode } from '../services/gemini';
import { saveHistory } from '../services/firebase';
import './Modules.css';

export default function CssToTailwind({ onLoadData }) {
  const [input, setInput] = useState('');
  const [data, setData] = useState(null); // Holds { analysis: string, conversions: [] }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onLoadData) {
      // If history data is present, populate the state immediately
      // Note: Prioritize the full input if available, otherwise fallback to truncated
      setInput(onLoadData.input || ''); 
      setData(onLoadData.fullOutput || null);
    }
  }, [onLoadData]);

  const handleConvert = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);

    try {
      // Call the API
      // convert.js ensures this returns a parsed Object, not a string.
      const result = await convertCode('css-to-tailwind', input);

      // Validate structure
      if (result && result.conversions) {
          setData(result);
          // Save the history using the full object
          await saveHistory('css-tailwind', input, result);
      } else {
           console.error("Unexpected structure:", result);
           throw new Error("AI returned an unexpected structure.");
      }

    } catch (error) {
      alert(`Conversion failed. Error: ${error.message}`);
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>CSS to Tailwind Converter</h1>
        <p>Transform standard CSS into utility-first Tailwind classes, handling complex selectors and modern functions.</p>
      </header>

      <div className="converter-grid">
        {/* Input Column */}
        <div className="panel input-panel">
          <h3>Input CSS</h3>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=".card { padding: 20px; background: #fff; }"
          />
          <button 
            className="primary-button action-btn" 
            onClick={handleConvert} 
            disabled={loading}
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        {/* Output Column */}
        <div className="panel output-panel">
          <h3>Output & Analysis</h3>
          {data ? (
            <div className="results-container">
              
              {/* Display the detailed analysis */}
              <div className="ai-summary">
                <strong>AI Analysis:</strong> 
                <p>{data.analysis}</p>
              </div>
              
              {/* Display individual selector conversions */}
              <div className="selectors-list">
                {data.conversions.map((item, idx) => (
                  <div key={idx} className="selector-card">
                    <div className="selector-name">{item.selector}</div>
                    <div className="tailwind-code">
                      <code>{item.tailwindClasses}</code>
                      <button 
                        className="primary-button copy-btn"
                        onClick={() => navigator.clipboard.writeText(item.tailwindClasses)}
                      >
                       Copy
                      </button>
                    </div>
                    <p className="explanation">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="placeholder-text">
              {loading ? 'Analyzing and converting...' : 'Output will appear here...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
