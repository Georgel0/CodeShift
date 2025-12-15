import { useState, useEffect } from 'react';
import { convertCode } from '../services/gemini';
import { saveHistory } from '../services/firebase';
import './Modules.css';

export default function CodeAnalysis({ onLoadData }) {
 const [input, setInput] = useState('');
 const [analysis, setAnalysis] = useState('');
 const [loading, setLoading] = useState(false);
 
 useEffect(() => {
  if (onLoadData) {
   const codeToAnalyze = onLoadData.input || '';
   setInput(codeToAnalyze);
   
   if (onLoadData.fullOutput?.analysis) {
    setAnalysis(onLoadData.fullOutput.analysis);
   } else if (onLoadData.sourceModule === 'converter' && codeToAnalyze) {
    // Auto-trigger analysis if code is passed from the converter module
    handleAnalyze(codeToAnalyze);
   } else {
    setAnalysis('');
   }
  }
 }, [onLoadData]);
 
 const handleAnalyze = async (codeOverride) => {
  const codeToProcess = codeOverride || input;
  if (!codeToProcess.trim()) return;
  
  setLoading(true);
  setAnalysis('');
  
  try {
   // API call with the dedicated 'analysis' type
   const result = await convertCode('analysis', codeToProcess);
   
   if (result && result.analysis) {
    setAnalysis(result.analysis);
    // Save analysis to history
    await saveHistory('analysis', codeToProcess, result);
   } else {
    throw new Error("Analysis failed: AI returned an empty response.");
   }
  } catch (error) {
   alert(`Analysis failed: ${error.message}`);
  }
  setLoading(false);
 };
 
 const handleCopy = () => {
  if (analysis) {
   navigator.clipboard.writeText(analysis);
  }
 };
 
 return (
  <div className="module-container">
      <header className="module-header">
        <h1>Code Analysis</h1>
        <p>Get a detailed, expert explanation of any code snippet.</p>
      </header>

      <div className="split-view">
        {/* Input Panel */}
        <div className="panel input-panel">
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Paste code here to analyze (e.g., the output from the converter)..." 
            spellCheck="false"
          />
          <button 
            className="primary-button action-btn" 
            onClick={() => handleAnalyze()} 
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>

        {/* Output Panel - Text Based */}
        <div className="panel output-panel">
          <div className="results-container">
            {analysis ? (
              <>
                <div className="ai-summary full-height-summary">
                  {/* Simple rendering for analysis with line breaks */}
                  {analysis.split('\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: line }} style={{ minHeight: line ? 'auto' : '1rem' }} />
                  ))}
                </div>
                <button 
                  className="primary-button copy-btn"
                  onClick={handleCopy}
                >
                  Copy Analysis
                </button>
              </>
            ) : (
              <div className="placeholder-text">
                {loading ? 'AI is thinking...' : 'Analysis results will appear here.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
 );
}