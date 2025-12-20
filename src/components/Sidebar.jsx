import { useState, useEffect, useRef } from 'react';
import { getHistory, deleteHistoryItem, clearAllHistory, cleanupOldHistory } from '../services/firebase';
import './Sidebar.css';

export default function Sidebar({ activeModule, setActiveModule, isOpen, toggleSidebar, loadFromHistory }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const sidebarRef = useRef(null);

  const refreshHistory = async () => {
    await cleanupOldHistory();
    const data = await getHistory();
    setHistoryItems(data);
  };
  
  useEffect(() => { if (isOpen) refreshHistory(); }, [isOpen]);

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteHistoryItem(itemId);
      setHistoryItems(prev => prev.filter(item => item.id !== itemId));
    } finally { setIsDeleting(false); }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await clearAllHistory();
      setHistoryItems([]);
    } finally { setIsDeleting(false); }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} ref={sidebarRef}>
      <div className="sidebar-header">
        <h2>ReCode</h2>
        <button onClick={toggleSidebar}>✕</button>
      </div>

      <div className="history-section">
        <div className="history-header">
          <h3>History:</h3>
          <div className="history-controls">
            <button onClick={refreshHistory}>↻</button>
            <button onClick={handleDeleteAll} disabled={isDeleting || historyItems.length === 0}>
              <i className="fas fa-trash-sweep"></i> Clear
            </button>
          </div>
        </div>
        <div className="history-list">
          {historyItems.map(item => (
            <div key={item.id} className="history-card" onClick={() => loadFromHistory(item)}>
              <div className="history-card-content">
                <span>{item.type}</span>
              </div>
              <button onClick={(e) => handleDelete(e, item.id)} disabled={isDeleting}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}