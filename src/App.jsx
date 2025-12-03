import { useState } from 'react';
import Sidebar from './components/Sidebar';
import CssToTailwind from './modules/CssToTailwind';
import PlaceholderModule from './modules/PlaceholderModules';
import './index.css';

function App() {
  const [activeModule, setActiveModule] = useState('css-tailwind');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // State to hold data if we are loading from history
  const [loadedData, setLoadedData] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const loadFromHistory = (historyItem) => {
    // Determine which module to switch to based on history type
    if (historyItem.type === 'css-tailwind') {
      setActiveModule('css-tailwind');
      // In a real app, we would pass this data into the module via props or Context
      console.log("Loaded from history:", historyItem);
      setLoadedData(historyItem); // Store this to pass to the module later
      alert("Loaded history item. (Integration logic to populate fields would go here)");
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'css-tailwind':
        // Pass loadedData if you want to implement history restoration later
        return <CssToTailwind onLoadData={loadedData} />;
      case 'ts-js':
        return <PlaceholderModule title="TypeScript to JavaScript" icon="📘" />;
      case 'regex':
        return <PlaceholderModule title="Regex Generator" icon="🧩" />;
      case 'sql':
        return <PlaceholderModule title="SQL Builder" icon="🗄️" />;
      case 'json':
        return <PlaceholderModule title="JSON Formatter" icon="📋" />;
      default:
        return <CssToTailwind />;
    }
  };

  return (
    <div className="container">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        loadFromHistory={loadFromHistory}
      />
      
      <main className="main-content">
        {/* Mobile Header to open Sidebar */}
        <div className="mobile-header" style={{ display: 'none' }}> 
           {/* Controlled via CSS media queries in index.css usually, 
               but inline style here for quick toggle logic */}
           <button onClick={toggleSidebar} style={{ padding: '1rem', background: 'transparent', color: '#fff', fontSize: '1.5rem' }}>
             ☰
           </button>
          
           <span>CodeShift</span>
        </div>
        
        {/* Small inline style for mobile hamburger visibility logic */}
        <style>{`
          @media (max-width: 768px) {
            .mobile-header { display: flex !important; align-items: center; background: var(--bg-secondary);
            border-bottom: 1px solid var(--border); }
          }
        `}</style>

        {renderModule()}
      </main>
    </div>
  );
}

export default App;
