// modules/CssFrameworkConverter.jsx

import { useState, useEffect } from 'react';
import { convertCode } from '../services/gemini';
import { saveHistory } from '../services/firebase';
import './Modules.css';

const TARGET_FRAMEWORKS = [
  { value: 'tailwind', label: 'Tailwind CSS' },
  { value: 'bootstrap', label: 'Bootstrap' },
  { value: 'sass', label: 'SASS/SCSS' },
  { value: 'less', label: 'LESS' },
];

export default function CssFrameworkConverter({ onLoadData, preSetTarget = 'tailwind' }) {
  const [input, setInput] = useState('');
  const [targetLang, setTargetLang] = useState(preSetTarget); 
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);

  // Load data from history or preSetTarget on component mount/update
  useEffect(() => {
    if (onLoadData) {
      setInput(onLoadData.input || ''); 
      setData(onLoadData.fullOutput || null);
      // Restore the specific framework used if it was saved
      if (onLoadData.targetLang) setTargetLang(onLoadData.targetLang);
    } else {
      // If no history, use the default preset (e.g., 'tailwind')
      setTargetLang(preSetTarget);
      setInput('');
      setData(null);
    }
  }, [onLoadData, preSetTarget]);
  
  // Main Conversion Handler
  const handleConvert = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);

    try {
      // Use the 'css-framework' type in the API call
      // sourceLang is 'css', targetLang is the selected framework (tailwind, bootstrap, etc.)
      const result = await convertCode('css-framework', input, 'css', targetLang);

      if (result && result.conversions) {
          setData(result);
          // Save history with the specific target framewor
          await saveHistory('css-framework', input, result, 'css', targetLang); 
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
  
  const targetLabel = TARGET_FRAMEWORKS.find(f => f.value === targetLang)?.label || 'Classes';

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>CSS Framework Converter</h1>
        <p className="module-description">Convert standard CSS into a utility framework or preprocessor format.</p>
      </header>
      <div className="converter-grid">
        {/* Input Column */}
        <div className="panel input-panel">
          <h3>Input: Standard CSS</h3>
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder=".btn { padding: 10px 20px; border-radius: 4px; color: white; }" 
            spellCheck="false"
            style={{ flexGrow: 1 }}
          />
          <button 
            className="primary-button action-btn" 
            onClick={handleConvert} 
            disabled={loading || !input.trim()}
          >
            {loading ? 'Converting...' : `Convert to ${targetLabel}`}
          </button>
        </div>

        {/* Output Column */}
        <div className="panel output-panel">
          <div className="selector-bar" style={{ marginBottom: '1rem' }}>
            <h3>Output:</h3>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="lang-select"
            >
              {TARGET_FRAMEWORKS.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          {data ? (
            <div className="results-container">
              
              {/* Display the detailed analysis */}
              <div className="ai-summary">
                <strong>AI Analysis:</strong> 
                <p>{data.analysis}</p>
              </div>
              
              {/* Display individual selector conversions */}
              <div className="selectors-list" style={{ flexGrow: 1, overflowY: 'auto' }}>
                {data.conversions.map((item, idx) => (
                  <div key={idx} className="selector-card">
                    <div className="selector-name">{item.selector}</div>
                    <div className="tailwind-code">
                      <pre>
                        {item.tailwindClasses}
                      </pre>
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
            <div className="placeholder-text" style={{ flexGrow: 1 }}>
              {loading ? 'Analyzing and converting...' : 'Output will appear here...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}