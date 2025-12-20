import { useState, useEffect } from 'react';
import { convertCode } from '../services/api';
import { saveHistory } from '../services/firebase';
import './Modules.css';

const TARGET_FRAMEWORKS = [
  { value: 'tailwind', label: 'Tailwind CSS' },
  { value: 'bootstrap', label: 'Bootstrap' },
  { value: 'sass', label: 'SASS/SCSS' },
  { value: 'less', label: 'LESS' },
];

export default function CssFrameworkConverter({ onLoadData, preSetTarget = 'tailwind', onSwitchModule }) {
  const [input, setInput] = useState('');
  const [targetLang, setTargetLang] = useState(preSetTarget);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onLoadData) {
      setInput(onLoadData.input || '');
      setData(onLoadData.fullOutput || null);
      if (onLoadData.targetLang) setTargetLang(onLoadData.targetLang);
    } else {
      setTargetLang(preSetTarget);
      setInput('');
      setData(null);
    }
  }, [onLoadData, preSetTarget]);

  const handleConvert = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);

    try {
      const result = await convertCode('css-framework', input, 'css', targetLang);
      if (result && result.conversions) {
        setData(result);
        await saveHistory('css-framework', input, result, 'css', targetLang);
      }
    } catch (error) {
      console.error("Conversion failed:", error);
    }
    setLoading(false);
  };

  const handleAnalyze = (snippet) => {
    if (onSwitchModule) {
      onSwitchModule('analysis', { input: snippet, sourceModule: 'css-framework' });
    }
  };

  const targetLabel = TARGET_FRAMEWORKS.find(f => f.value === targetLang)?.label || 'Classes';

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>CSS Framework Converter</h1>
      </header>

      <div className="converter-grid">
        <div className="panel input-panel">
          <h3>Input: Standard CSS</h3>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)} 
            placeholder=".btn { color: red; }" 
            className="flex-grow"
          />
          <div className="action-row">
            <button className="primary-button" onClick={handleConvert} disabled={loading}>
              {loading ? 'Converting...' : `Convert to ${targetLabel}`}
            </button>
          </div>
        </div>

        <div className="panel output-panel">
          <div className="selector-bar">
            <h3>Output:</h3>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              {TARGET_FRAMEWORKS.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          
          {data ? (
            <div className="results-container">
              <div className="selectors-list">
                {data.conversions.map((item, idx) => {
                  const displayCode = item.convertedCode || item.tailwindClasses || "";
                  return (
                    <div key={idx} className="selector-card">
                      <div className="selector-name">{item.selector}</div>
                      <div className="code-result-box">
                        <pre className="code-pre">{displayCode}</pre>
                      </div>
                      <div className="card-actions">
                        <button onClick={() => navigator.clipboard.writeText(displayCode)}>Copy</button>
                        <button onClick={() => handleAnalyze(displayCode)}>Analyze</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <div className="placeholder-text">{loading ? 'Converting...' : 'Output will appear here...'}</div>}
        </div>
      </div>
    </div>
  );
}