import { useState } from 'react';
import './LoginFlow.css';

const SITE_KEY = 'lingo_site_verified';
const USER_KEY = 'lingo_username';

export default function LoginFlow({ onDone }) {
  const siteOk = localStorage.getItem(SITE_KEY) === 'true';
  const savedUser = localStorage.getItem(USER_KEY);

  const [step, setStep] = useState(
    savedUser ? 'done' : siteOk ? 2 : 1
  );
  const [sitePass, setSitePass] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // 如果已有 username，直接進入
  if (step === 'done') {
    onDone(savedUser);
    return null;
  }

  const handleSitePassword = () => {
    if (sitePass.trim() === (import.meta.env.VITE_SITE_PASSWORD || '').trim()) {
      localStorage.setItem(SITE_KEY, 'true');
      setError('');
      setStep(2);
    } else {
      setError('密碼錯誤，請再試一次 🐠');
    }
  };

  const handleUsername = () => {
    const name = username.trim();
    if (!name) { setError('請輸入使用者名稱'); return; }
    if (name.length < 2) { setError('名稱至少 2 個字'); return; }
    localStorage.setItem(USER_KEY, name);
    setError('');
    setStep(3);
  };

  const handleEnter = () => {
    onDone(username.trim());
  };

  return (
    <div className="login-bg">
      <div className="bubbles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bubble"
            style={{ '--delay': `${i * 0.5}s`, '--size': `${20 + i * 8}px`, '--left': `${10 + i * 11}%` }}
          />
        ))}
      </div>

      {/* Step 1：網站密碼 */}
      {step === 1 && (
        <div className="login-card animate-fadeInUp">
          <div className="login-logo">🐬</div>
          <h1 className="login-title">Lingo Agenda</h1>
          <p className="login-sub">請輸入網站密碼</p>
          <div className="login-form">
            <div className="username-input-wrap">
              <span className="username-icon">🔑</span>
              <input
                type="password"
                placeholder="網站密碼"
                value={sitePass}
                onChange={e => setSitePass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSitePassword()}
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSitePassword}>
              進入 🌊
            </button>
          </div>
          <div className="login-deco">🐢 &nbsp; 🐠 &nbsp; 🪼 &nbsp; 🐡</div>
        </div>
      )}

      {/* Step 2：輸入使用者名稱（無密碼） */}
      {step === 2 && (
        <div className="login-card animate-fadeInUp">
          <div className="login-logo">🐬</div>
          <h1 className="login-title">Lingo Agenda</h1>
          <p className="login-sub">您叫什麼名字？</p>
          <div className="login-form">
            <div className="username-input-wrap">
              <span className="username-icon">👤</span>
              <input
                type="text"
                placeholder="輸入使用者名稱"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUsername()}
                autoFocus
                autoCapitalize="none"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleUsername}>
              確認 ✨
            </button>
          </div>
          <p className="login-hint">此裝置只需設定一次，之後自動登入</p>
          <div className="login-deco">🐢 &nbsp; 🐠 &nbsp; 🪼 &nbsp; 🐡</div>
        </div>
      )}

      {/* Step 3：歡迎畫面 */}
      {step === 3 && (
        <div className="login-card animate-fadeInUp" style={{ textAlign: 'center' }}>
          <div className="login-logo animate-dolphin">🐬</div>
          <h1 className="login-title">歡迎，{username.trim()}！</h1>
          <p className="login-sub" style={{ fontSize: '20px', margin: '16px 0 28px' }}>
            此裝置已完成登記<br />準備好開始學習了嗎？🌊
          </p>
          <button
            className="btn btn-primary"
            style={{ fontSize: '20px', padding: '16px 40px' }}
            onClick={handleEnter}
          >
            出發！ 🚀
          </button>
          <div className="login-deco" style={{ marginTop: '24px' }}>🐢 &nbsp; 🐠 &nbsp; 🪼 &nbsp; 🐡</div>
        </div>
      )}
    </div>
  );
}
