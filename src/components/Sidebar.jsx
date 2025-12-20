import { useState, useEffect, useRef } from 'react';
import { getHistory, deleteHistoryItem, cleanupOldHistory } from '../services/firebase';
import './Sidebar.css';
import { useTheme } from './ThemeContext';

export default function Sidebar({ activeModule, setActiveModule, isOpen, toggleSidebar, loadFromHistory }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentTheme, changeTheme, groupedThemes } = useTheme();
  //Closeing the history when clicking outside of it (mobile)
  const sidebarRef = useRef(null);
  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isOpen && window.innerWidth < 768 && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, toggleSidebar]);
  
  const refreshHistory = async () => {
    //Run cleanup before fetching history
    await cleanupOldHistory();
    const data = await getHistory();
    setHistoryItems(data);
  };
  
  useEffect(() => {
    if (isOpen) refreshHistory();
  }, [isOpen]);
  
  //Hamdle individual deletion
  const handleDelete = async (e, itemId) => {
    //Prevent triggering loadFromHistory
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this history item?')) {
      setIsDeleting(true);
      try {
        await deleteHistoryItem(itemId);
        setHistoryItems(historyItems.filter(item => item.id !== itemId));
      } catch (error) {
        alert('Failed to delete history item.');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const modules = [
    { id: 'converter', label: 'Code Converter', icon: 'fas fa-sync-alt' },
    { id: 'analysis', label: 'Code Analyzer', icon: 'fas fa-brain' },
    { id: 'generator', label: 'Code Generator', icon: 'fas fa-magic' },
    { id: 'css-tailwind', label: 'CSS Frameworks', icon: 'fas fa-swatchbook' },
    { id: 'regex', label: 'Regex Generator', icon: 'fas fa-search' },
    { id: 'sql', label: 'SQL Builder', icon: 'fas fa-database' },
    { id: 'json', label: 'JSON Formatter', icon: 'fas fa-list-alt' },
  ];
  
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} ref={sidebarRef}>
      <div className="sidebar-header">
        <div className="logo-group">
          <div className="logo-image" />
          <h2>ReCode</h2>
        </div>
        <button className="close-btn" onClick={toggleSidebar}>
          ✕
        </button>
      </div>

      <nav className="nav-menu">
        <h3>Modules</h3>
        {modules.map(module => (
          <a
            key={module.id}
            href="#"
            className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
            onClick={() => setActiveModule(module.id)}
          >
             <i className={module.icon}></i>
             {module.label}
          </a>
        ))}
      </nav>
      
      <div className="theme-selector-group">
        <h3>Theme:</h3>
        <select value={currentTheme} onChange={(e) => changeTheme(e.target.value)} className="theme-select-dropdown">
          {Object.entries(groupedThemes).map(([group, themes]) => (
            <optgroup key={group} label={group}>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="history-section">
        <div className="history-header">
          <h3>History:</h3>
          <button className="refresh-btn" onClick={refreshHistory}>↻</button>
        </div>
        <div className="history-list">
          {historyItems.length === 0 ? (
            <p className="empty-state">No conversions yet.</p>
          ) : (
            historyItems.map(item => (
              <div key={item.id} className="history-card" onClick={() => loadFromHistory(item)}>
                <div className="history-card-content">
                  {/* Display language pair for generic converter */}
                  <span className="history-type">
                    {item.type === 'converter' 
                      ? `${item.sourceLang?.toUpperCase()} to ${item.targetLang?.toUpperCase()}`
                      : item.type}
                  </span>
                  <span className="history-date">{item.createdAt && item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                </div>
                <button className="delete-item-btn" onClick={(e) => handleDelete(e, item.id)} disabled={isDeleting}>
                  <i className="fas fa-trash"></i>
                  </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}