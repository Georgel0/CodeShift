import './Modules.css';

export default function PlaceholderModule({ title, icon }) {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>{title}</h1>
      </header>
      <div className="converter-grid placeholder-container">
        <div className="panel placeholder-panel">
            <i className={`${icon} placeholder-icon`}></i>
            <h2>Coming Soon</h2>
            <p className="placeholder-message">
                The <strong>{title}</strong> module is currently under development. <br/>
                Check back later for updates!
            </p>
        </div>
      </div>
    </div>
  );
}