import { useState, useEffect } from 'react';
import { convertCode } from '../services/api';
import { saveHistory } from '../services/firebase';
import './Modules.css';

export default function CodeGenerator({ onLoadData, onSwitchModule }) {
  const [input, setInput] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onLoadData) {
      setInput(onLoadData.input || '');
      // Handle loading from history (structure depends on how it was saved)
      const savedOutput = onLoadData.fullOutput?.convertedCode || onLoadData.fullOutput?.text || '';
      setOutputCode(savedOutput);
    }
  }, [onLoadData]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutputCode('');

    try {
      // Call API with type 'generator'
      const result = await convertCode('generator', input);

      // Handle success (expecting convertedCode from our updated backend)
      if (result && result.convertedCode) {
        setOutputCode(result.convertedCode);
        await saveHistory('generator', input, result);
      } else {
        throw new Error("AI returned an unexpected structure.");
      }
    } catch (error) {
      alert(`Generation failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Code Generator</h1>
        <p>Describe the code you need, and the AI will write it for you.</p>
      </header>

      <div className="converter-grid">
        {/* Input Panel */}
        <div className="panel input-panel">
          <h3>Description / Prompt</h3>
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="E.g., Write a Python script to scrape weather data from a website..." 
            spellCheck="false"
            style={{ flexGrow: 1 }}
          />
          <button 
            className="primary-button action-btn" 
            onClick={handleGenerate} 
            disabled={loading || !input.trim()}
          >
            {loading ? 'Generating...' : 'Generate Code'}
          </button>
        </div>

        {/* Output Panel */}
        <div className="panel output-panel">
          <h3>Generated Code</h3>
          <div className="results-container">
            {outputCode ? (
              <div style={{ position: 'relative', flex: 1, display: 'flex' }}> 
                <div className="selector-card" style={{ width: '100%', margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="tailwind-code" style={{ flex: 1 }}>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{outputCode}</pre>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                             <button 
                                className="primary-button copy-btn" 
                                onClick={() => navigator.clipboard.writeText(outputCode)}
                            >
                                Copy
                            </button>
                            <button 
                                className="primary-button" 
                                style={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }}
                                onClick={() => onSwitchModule('analysis', { input: outputCode, sourceModule: 'generator' })}
                            >
                                Analyze This
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="placeholder-text">
                {loading ? 'AI is writing your code...' : 'Result will appear here...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
