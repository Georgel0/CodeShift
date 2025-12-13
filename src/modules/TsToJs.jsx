import { useState, useEffect } from 'react';
import { convertCode } from '../services/gemini';
import { saveHistory } from '../services/firebase';
import './Modules.css';

export default function TsToJs({ onLoadData }) {
 // 'direction' determines if we are doing TS to JS or JS to TS
 const [direction, setDirection] = useState('ts-to-js');
 const [input, setInput] = useState('');
 const [outputData, setOutputData] = useState(null);
 const [loading, setLoading] = useState(false);
 
 useEffect(() => {
  if (onLoadData) {
   //if loading from history, restore the specific type used: ts to js or js to ts
   if (onLoadData.type) setDirection(onLoadData.type);
   setInput(onLoadData.input || '');
   setOutputData(onLoadData.fullOutput || null);
  }
 }, [onLoadData]);
 
 const handleConvert = async () => {
  if (!input.trim()) return;
  setLoading(true);
  setOutputData(null);
  
  try {
   //pass the current 'direction' as the type of the API
   const result = await convertCode(direction, input);
   
   if (result && result.convertedCode) {
    setOutputData(result);
    await saveHistory(direction, input, result);
   } else {
    throw new Error("Unexpected response structure.");
   }
  } catch (error) {
   alert(`Conversion failed: ${error.message}`);
  }
  setLoading(false);
 };
 
 const toggleDirection = () => {
  //swap direction and clear output to avoid confusion
  setDirection(prev => prev === 'ts-to-js' ? 'js-to-ts' : 'ts-to-js');
  setOutputData(null);
 };
 
 // Helper labels based on direction
 const inputLabel = direction === 'ts-to-js' ? 'TypeScript (Input)' : 'JavaScript (Input)';
 const outputLabel = direction === 'ts-to-js' ? 'JavaScript (Output)' : 'TypeScript (Output)';
 
 return (
  <div className="module-container">
   <header className="module-header">
    <h1>TS <i className="fas fa-rotate"></i> JS Convertor</h1>
    <p>Convert TypeScript interfaces to modern JavaScript or infer types from JS code.</p>
   </header>
   
   <div className="converter-grid">
    {/* Input Column */}
    <div className="panel input-panel">
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <h3>{inputLabel}</h3>
      <button onClick={toggleDirection} className="primary-button" style={{ padding: '4px 12px', fontSize: '0.8rem', marginTop: 0 }}
      title="Switch Direction">
       Swap ⇄
      </button>
     </div>
     
     <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={direction === 'ts-to-js' ? "interface User { id: number; name: string; }" : "const user = { id: 1, name: 'John' };"} style={{ height: '300px' }} />
     
     <button className="primary-button action-btn" onClick={handleConvert} disabled={loading}>
      {loading ? 'Converting...' : `Convert to ${direction === 'ts-to-js' ? 'JS' : 'TS'}`}
     </button>
    </div>
    
    {/* Output Column*/}
    <div className="panel output-panel">
     <h3>{outputLabel}</h3>
     
     {outputData ? (<div className="results-container">
      {/* Code Display*/}
      <div className="selector-card" style={{ marginTop: 0 }}>
       <div className="tailwind-code">
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
         {outputData.convertedCode}
        </pre>
        <button className="primary-button copy-btn" onClick={() => navigator.clipboard.writeText(outputData.convertedCode)}>
         Copy
        </button>
       </div>
      </div>
      
      {/*Analysis*/}
      {outputData.explanation && (
       <div className="ai-summary" style={{ marginTop: '1rem' }}>
        <strong>Notes:</strong>
        <p>{outputData.explanation}</p>
       </div>
      )}
     </div> 
     ) : (
      <div className="placeholder-text">
       {loading ? "Processing logic..." : "Output code will appear here..."}
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
