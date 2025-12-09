import { useState, useEffect, useRef } from 'react';
import { getHistory } from '../services/firebase';
import './Sidebar.css';
import { useTheme } from './ThemeContext';

export default function Sidebar({ activeModule, setActiveModule, isOpen, toggleSidebar, loadFromHistory }) {
  const [historyItems, setHistoryItems] = useState([]);
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
    const data = await getHistory();
    setHistoryItems(data);
  };

  useEffect(() => {
    if (isOpen) refreshHistory();
  }, [isOpen]);

  const navItems = [
    { id: 'css-tailwind', label: 'CSS to Tailwind' },
    { id: 'ts-js', label: 'TS to JS' },
    { id: 'regex', label: 'Regex Generator' },
    { id: 'sql', label: 'SQL Builder' },
    { id: 'json', label: 'JSON Formatter' },
  ];

  return (
    <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>CodeShift</h2>
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
                <span className="history-type">{item.type}</span>
                <span className="history-date">{new Date(item.createdAt.seconds * 1000).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
