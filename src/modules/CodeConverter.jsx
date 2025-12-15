import { useState, useEffect } from 'react';
import { convertCode } from '../services/gemini';
import { saveHistory } from '../services/firebase';
import './Modules.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', 'label': 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
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
      // Restore history
      setInput(onLoadData.input || '');
      setOutputCode(onLoadData.fullOutput?.convertedCode || '');
      
      // Restore languages from history
      if (onLoadData.sourceLang) setSourceLang(onLoadData.sourceLang);
      if (onLoadData.targetLang) setTargetLang(onLoadData.targetLang);
    }
  }, [onLoadData]);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    // Swap input and output content
    setInput(outputCode);
    setOutputCode(''); // Clear output as it's now old
  };
  const handleConvert = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutputCode('');

    try {
      // API call with the generic 'converter' type
      const result = await convertCode('converter', input, sourceLang, targetLang);

      if (result && result.convertedCode) {
        setOutputCode(result.convertedCode);
        // Save history with language metadata
        await saveHistory('converter', input, result, sourceLang, targetLang);
      } else {
        throw new Error("Unexpected response structure.");
      }
    } catch (error) {
      alert(`Conversion failed: ${error.message}`);
    }
    setLoading(false);
  };
  
  const handleSendToAnalysis = () => {
    if (outputCode) {
        // Pass the output code as the input for the analysis module, and trigger the module switch
        onSwitchModule('analysis', { input: outputCode, sourceModule: 'converter' });
    }
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
        <p>Translate code between {LANGUAGES.length} programming languages with language swapping.</p>
      </header>

      <div className="converter-grid">
        {/* Input Panel */}
        <div className="panel">
          <h3>Source Code: {LANGUAGES.find(l => l.value === sourceLang)?.label}</h3>
          
          {/* Controls: Select Language */}
          <div className="action-row" style={{ marginBottom: '1.5rem', justifyContent: 'flex-start' }}>
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
            placeholder={`Paste your ${LANGUAGES.find(l => l.value === sourceLang)?.label || 'source'} code here...`} 
            spellCheck="false"
          />

      
          {/* Action Bar */}
          <div className="action-row">
             <button className="primary-button" onClick={handleSwap}>
                ⇄ Swap
             </button>
             <button className="primary-button" onClick={handleConvert} disabled={loading}>
              {loading ? 'Converting...' : 'Convert Code'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="panel">
          <h3>Target Code: {LANGUAGES.find(l => l.value === targetLang)?.label}</h3>
          
          {/* Controls: Select Language & Analysis Button */}
          <div className="action-row" style={{ marginBottom: '1.5rem', justifyContent: 'space-between' }}>
            <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                className="lang-select"
            >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            
            {outputCode && (
                <button className="primary-button" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} onClick={handleSendToAnalysis} title="Get detailed explanation">
                    Code Analysis
                </button>
            )}
          </div>

          <div className="results-container">
          
            {outputCode ? (
                <div style={{ position: 'relative', flex: 1 }}> 
                    <textarea 
                        value={outputCode} 
                        readOnly 
                        style={{ height: '100%', paddingRight: '4rem' }} 
                        spellCheck="false"
                    />
                    <button className="copy-btn" onClick={handleCopy} style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                        {copyFeedback}
                    </button>
                </div>
            ) : (
                <div className="placeholder-text">
                    {loading ? 'AI is processing...' : 'Your converted code will appear here.'}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}