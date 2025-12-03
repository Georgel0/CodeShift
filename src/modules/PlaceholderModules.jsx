import './Modules.css';

export default function PlaceholderModule({ title, icon }) {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>{title}</h1>
      </header>
      <div className="panel" style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
        <h2>Coming Soon</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This feature is currently under development.
        </p>
      </div>
    </div>
  );
}
