import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CodeConverter from './modules/CodeConverter';
import CodeAnalysis from './modules/CodeAnalysis';
import CssFrameworkConverter from './modules/CssFrameworkConverter'; 
import PlaceholderModule from './modules/PlaceholderModules'; 
import Notification from './components/Notification';
import './index.css';
import { useTheme } from './components/ThemeContext';
import { initializeAuth } from './services/firebase';

function App() {
  const [activeModule, setActiveModule] = useState('converter');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moduleData, setModuleData] = useState(null);
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
    let targetModule = 'converter';
    
    if (historyItem.type === 'css-framework' || historyItem.type === 'css-tailwind') {
        targetModule = 'css-tailwind'; 
    } else if (historyItem.type === 'analysis') {
        targetModule = 'analysis';
    } else if (historyItem.type === 'generator') {
        targetModule = 'generator';
    } 
    
    handleModuleSwitch(targetModule, historyItem);
    setNotificationMessage(`History loaded: ${historyItem.type} conversion.`);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'converter':
        return <CodeConverter onLoadData={moduleData} onSwitchModule={handleModuleSwitch} />;
      
      case 'analysis':
        return <CodeAnalysis onLoadData={moduleData} onSwitchModule={handleModuleSwitch} />;
      
      case 'css-tailwind': 
        // Renders the generic CSS converter, defaulting to Tailwind
        return <CssFrameworkConverter onLoadData={moduleData} preSetTarget="tailwind" />;

      case 'ts-js': 
        // Re-route old specific modules to the generic CodeConverter
        return <CodeConverter onLoadData={moduleData} onSwitchModule={handleModuleSwitch} preSetSource="typescript" preSetTarget="javascript" />;
      
      // Temporary placeholders for in-progress modules
      case 'generator':
        return <PlaceholderModule title="Code Generator" icon="fas fa-magic" type="generator" onLoadData={moduleData} />;
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