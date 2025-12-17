import './Modules.css';

export default function PlaceholderModule({ title, icon }) {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>{title}</h1>
      </header>
      <div className="converter-grid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="panel" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
            <i className={icon} style={{ fontSize: '4rem', marginBottom: '1.5rem', color: 'var(--accent)' }}></i>
            <h2>Coming Soon</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                The <strong>{title}</strong> module is currently under development. <br/>
                Check back later for updates!
            </p>
        </div>
      </div>
    </div>
  );
}