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
    //Preven triggering loadFromHistory when clicking the delete button
    e.stopPropagation();
    if (!window.confirm("Delete this history item?")) return;
    
    setIsDeleting(true);
    try {
      await deleteHistoryItem(itemId);
      setHistoryItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      alert("Failed to delete item.");
    }
    setIsDeleting(false);
  };
  
  // Helper for better history labels
  const getHistoryLabel = (item) => {
      if (item.type === 'converter') return `${item.sourceLang} → ${item.targetLang}`;
      if (item.type === 'css-tailwind') return 'CSS → Tailwind (Legacy)';
      if (item.type === 'ts-to-js') return 'TS → JS (Legacy)';
      if (item.type === 'js-to-ts') return 'JS → TS (Legacy)';
      if (item.type === 'analysis') return 'Code Analysis';
      if (item.type === 'generator') return 'Code Generator';
      return item.type;
  };

  const navItems = [
    { id: 'converter', label: 'Universal Converter' },
    { id: 'analysis', label: 'Code Analysis' },
    { id: 'generator', label: 'Code Generator' },
  ];

  return (
    <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>ReCode</h2>
        <button className="close-btn mobile-only" onClick={toggleSidebar}>×</button>
      </div>

      <nav className="nav-menu">
        <h3>Tools:</h3>
        {navItems.map(item => (
          <button 
            key={item.id}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={() => { setActiveModule(item.id); if(window.innerWidth < 768) toggleSidebar(); }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="theme-selector-section">
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
                  <span className="history-type">{getHistoryLabel(item)}</span>
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