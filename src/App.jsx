import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CodeConverter from './modules/CodeConverter';
import CodeAnalysis from './modules/CodeAnalysis';
import PlaceholderModule from './modules/PlaceholderModules'; 
import Notification from './components/Notification';
import './index.css';
import { useTheme } from './components/ThemeContext';
import { initializeAuth } from './services/firebase';

function App() {
  const [activeModule, setActiveModule] = useState('converter'); // Default to new converter
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moduleData, setModuleData] = useState(null); // Renamed loadedData for clarity
  const [notificationMessage, setNotificationMessage] = useState(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  useEffect(() => {
    initializeAuth();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Unified function to switch modules and pass data
  const handleModuleSwitch = (moduleName, data = null) => {
    setActiveModule(moduleName);
    setModuleData(data);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };
  
  const loadFromHistory = (historyItem) => {
    // Map old and new history types to the correct module component
    let targetModule = 'converter';
    if (historyItem.type === 'css-tailwind' || historyItem.type === 'ts-to-js' || historyItem.type === 'js-to-ts' || historyItem.type === 'converter') {
        targetModule = 'converter';
    } else if (historyItem.type === 'analysis') {
        targetModule = 'analysis';
    } else if (historyItem.type === 'generator') {
        targetModule = 'generator';
    } else {
        // Fallback for other placeholders
        targetModule = historyItem.type; 
    }
    
    setModuleData(historyItem);
    setActiveModule(targetModule);
    setNotificationMessage(`History loaded: ${historyItem.type} conversion.`);
    
    if (window.innerWidth < 768) setSidebarOpen(false);
  };
  
  const renderModule = () => {
    switch (activeModule) {
      case 'converter':
        return <CodeConverter onLoadData={moduleData} onSwitchModule={handleModuleSwitch} />;
      case 'analysis':
        return <CodeAnalysis onLoadData={moduleData} />;
      case 'generator':
        return <PlaceholderModule title="Code Generator" icon="fas fa-magic" />;
      
      
      case 'regex':
        return <PlaceholderModule title="Regex Generator" icon="fas fa-search" />;
      case 'sql':
        return <PlaceholderModule title="SQL Builder" icon="fas fa-database" />;
      case 'json':
        return <PlaceholderModule title="JSON Formatter" icon="fas fa-list-alt" />;
      default:
        return <CodeConverter />;
    }
  };

  return (
    <div className='container'>
      <Sidebar 
        activeModule={activeModule} 
        // Pass handleModuleSwitch to clear data when switching manually
        setActiveModule={(mod) => handleModuleSwitch(mod, null)} 
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        loadFromHistory={loadFromHistory}
      />
      
      <main className="main-content">
        <div className="mobile-header"> 
           <button className="sidebar-toggle" onClick={toggleSidebar}>
              ☰
           </button>
        <div className="logo-group">
          <div className="logo-image" />
          <span>ReCode</span>
        </div>
      </div>
      
      {renderModule()}
      </main>
       <Notification message={notificationMessage} /> 
     </div>
  );
}

export default App;