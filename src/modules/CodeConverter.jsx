import { useState, useEffect } from 'react';
import { convertCode } from '../services/api';
import { saveHistory } from '../services/firebase';
import './Modules.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C'},
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
];

export default function CodeConverter({ onLoadData, onSwitchModule }) {
  const [sourceLang, setSourceLang] = useState('javascript');
  const [targetLang, setTargetLang] = useState('python');
  const [input, setInput] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('Copy');

  useEffect(() => {
    if (onLoadData) {
      setInput(onLoadData.input || '');
      setOutputCode(onLoadData.fullOutput?.convertedCode || '');
      if (onLoadData.sourceLang) setSourceLang(onLoadData.sourceLang);
      if (onLoadData.targetLang) setTargetLang(onLoadData.targetLang);
    }
  }, [onLoadData]);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInput(outputCode);
    setOutputCode(''); 
  };

  const handleConvert = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutputCode('');

    try {
      const result = await convertCode('converter', input, sourceLang, targetLang);
      if (result && result.convertedCode) {
        setOutputCode(result.convertedCode);
        await saveHistory('converter', input, result, sourceLang, targetLang);
      } else {
        throw new Error("Unexpected response structure.");
      }
    } catch (error) {
      alert(`Conversion failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (outputCode) {
      navigator.clipboard.writeText(outputCode);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback('Copy'), 2000);
    }
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Universal Code Converter</h1>
        <p>Translate code between {LANGUAGES.length} programming languages.</p>
      </header>

      <div className="converter-grid">
        {/* Input Panel */}
        <div className="panel input-panel">
          <h3>Source: {LANGUAGES.find(l => l.value === sourceLang)?.label}</h3>
          
          <div className="action-row start" style={{ marginBottom: '1rem' }}>
            <select 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)}
              className="lang-select"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={`Paste your ${LANGUAGES.find(l => l.value === sourceLang)?.label} code here...`} 
            spellCheck="false"
            className="flex-grow"
          />

          <div className="action-row">
            <button className="primary-button secondary-action-btn" onClick={handleSwap}>
              ⇄ Swap
            </button>
            <button className="primary-button action-btn" onClick={handleConvert} disabled={loading || !input.trim()}>
              {loading ? 'Converting...' : 'Convert Code'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="panel output-panel">
          <h3>Target: {LANGUAGES.find(l => l.value === targetLang)?.label}</h3>
          
          <div className="action-row start" style={{ marginBottom: '1rem' }}>
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              className="lang-select"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div className="results-container">
            {outputCode ? (
              <div className="code-output-container"> 
                <div className="output-wrapper">
                  <textarea 
                    className="output-textarea"
                    value={outputCode} 
                    readOnly 
                    spellCheck="false"
                  />
                  <button className="primary-button copy-btn copy-btn-absolute" onClick={handleCopy}>
                    {copyFeedback}
                  </button>
                </div>
                
                <div className="action-row">
                  <button 
                    className="primary-button secondary-action-btn" 
                    onClick={() => onSwitchModule('analysis', { input: outputCode, sourceModule: 'converter' })}
                  >
                    Analyze Result
                  </button>
                </div>
              </div>
            ) : (
              <div className="placeholder-text">
                {loading ? 'AI is processing...' : 'Result will appear here...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}