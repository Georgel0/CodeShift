import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CssToTailwind from './modules/CssToTailwind';
import PlaceholderModule from './modules/PlaceholderModules';
import Notification from './components/Notification';
import './index.css';
import { useTheme } from './components/ThemeContext';

function App() {
  const [activeModule, setActiveModule] = useState('css-tailwind');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // State to hold data if we are loading from history
  const [loadedData, setLoadedData] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const { currentTheme } = useTheme();
  
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const loadFromHistory = (historyItem) => {
    // Determine which module to switch to based on history type
    if (historyItem.type === 'css-tailwind') {
      setActiveModule('css-tailwind');
      console.log("Loaded from history:", historyItem);
      setLoadedData(historyItem); // Store this to pass to the module later
      setNotificationMessage(`History loaded: ${historyItem.type} conversion.`);
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'css-tailwind':
        return <CssToTailwind onLoadData={loadedData} />;
      case 'ts-js':
        return <PlaceholderModule title="TypeScript to JavaScript" icon="fas fa-code" />;
      case 'regex':
        return <PlaceholderModule title="Regex Generator" icon="fas fa-search" />;
      case 'sql':
        return <PlaceholderModule title="SQL Builder" icon="fas fa-database" />;
      case 'json':
        return <PlaceholderModule title="JSON Formatter" icon="fas fa-list-alt" />;
      default:
        return <CssToTailwind />;
    }
  };

  return (
    <div className='container'>
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        loadFromHistory={loadFromHistory}
      />
      
      <main className="main-content">
        <div className="mobile-header"> 
           <button onClick={toggleSidebar} style={{ padding: '1rem', background: 'transparent', color: 'var(--text-primary)', fontSize: '1.5rem' }}>
             ☰
           </button>
        <div className="logo-group">
           <img src="/logo.png" alt="CodeShift Logo" className="logo-image" />
           <span>CodeShift</span>
        </div>
      </div>
      
      {renderModule()}
      </main>
       <Notification message={notificationMessage} /> 
     </div>
  );
}

export default App;
