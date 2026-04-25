import './Header.css';

const TABS = [
  { id: 'calendar', label: '行事曆 / 單字', emoji: '📅' },
  { id: 'progress', label: '今明進度', emoji: '🌊' },
  { id: 'tasks', label: '任務 / 待辦', emoji: '✅' },
  { id: 'summary', label: '每日總結', emoji: '📊' },
];

export default function Header({ username, activeTab, setActiveTab, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-logo">
          <span className="logo-emoji animate-swim">🐬</span>
          <span className="logo-text">Lingo Agenda</span>
        </div>
        <div className="header-right">
          <span className="header-user">👤 {username}</span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>登出</button>
        </div>
      </div>
      <nav className="header-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-emoji">{tab.emoji}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="header-wave">
        <svg viewBox="0 0 1200 24" preserveAspectRatio="none">
          <path d="M0,12 Q150,0 300,12 Q450,24 600,12 Q750,0 900,12 Q1050,24 1200,12 L1200,24 L0,24 Z" fill="rgba(126,200,227,0.25)" />
          <path d="M0,16 Q150,4 300,16 Q450,28 600,16 Q750,4 900,16 Q1050,28 1200,16" fill="none" stroke="rgba(126,200,227,0.5)" strokeWidth="1.5" />
        </svg>
      </div>
    </header>
  );
}
