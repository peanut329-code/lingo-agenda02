import { useState, useEffect, useRef } from 'react';
import './Pomodoro.css';

const PRESETS = [
  { label: '工作', minutes: 25, color: '#ffb3a7' },
  { label: '短休', minutes: 5, color: '#a8e6cf' },
  { label: '長休', minutes: 15, color: '#7ec8e3' },
];

const SOUNDS = [
  { id: 'wave', label: '🌊 海浪', freq: [200, 180, 160], type: 'wave' },
  { id: 'bell', label: '🔔 禪鐘', freq: [880, 660, 440], type: 'bell' },
  { id: 'wind', label: '🎐 風鈴', freq: [1200, 900, 600], type: 'wind' },
  { id: 'whale', label: '🐋 鯨語', freq: [120, 90, 60], type: 'whale' },
];

function playAlert(soundId, duration = 10) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const sound = SOUNDS.find(s => s.id === soundId) || SOUNDS[0];
  const endTime = ctx.currentTime + duration;

  if (sound.type === 'wave') {
    // ocean wave: filtered noise
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    gainNode.gain.linearRampToValueAtTime(0.1, endTime - 0.3);
    gainNode.gain.linearRampToValueAtTime(0, endTime);
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
    source.stop(endTime);
  } else {
    // tonal sounds
    const freqs = sound.freq;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = sound.type === 'bell' ? 'sine' : sound.type === 'wind' ? 'triangle' : 'sine';
      osc.frequency.value = f;
      const start = ctx.currentTime + i * (duration / freqs.length);
      const end = start + duration / freqs.length;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });
  }
}

export default function Pomodoro() {
  const [expanded, setExpanded] = useState(false);
  const [preset, setPreset] = useState(0);
  const [seconds, setSeconds] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState('wave');
  const [alertDuration, setAlertDuration] = useState(10);
  const [tomatoCount, setTomatoCount] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);
  const initialSeconds = PRESETS[preset].minutes * 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            playAlert(sound, alertDuration);
            if (!isBreak) setTomatoCount(c => c + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, sound, alertDuration, isBreak]);

  const selectPreset = (i) => {
    setPreset(i);
    setSeconds(PRESETS[i].minutes * 60);
    setRunning(false);
    setIsBreak(i !== 0);
  };

  const reset = () => {
    setRunning(false);
    setSeconds(PRESETS[preset].minutes * 60);
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const progress = 1 - seconds / initialSeconds;
  const circumference = 2 * Math.PI * 48;

  if (!expanded) {
    return (
      <button className="pomodoro-bubble" onClick={() => setExpanded(true)} title="番茄鐘">
        <span>🍅</span>
        {tomatoCount > 0 && <span className="tomato-badge">{tomatoCount}</span>}
      </button>
    );
  }

  return (
    <div className="pomodoro-panel">
      <div className="pomodoro-header">
        <span style={{ fontWeight: 700, fontSize: 17 }}>🍅 番茄鐘</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--ocean-dark)' }}>今日 {tomatoCount} 🍅</span>
          <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--deep-blue)' }}>✕</button>
        </div>
      </div>

      <div className="pomodoro-presets">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className={`preset-btn ${preset === i ? 'active' : ''}`}
            style={preset === i ? { background: p.color, borderColor: 'transparent' } : {}}
            onClick={() => selectPreset(i)}
          >
            {p.label} {p.minutes}m
          </button>
        ))}
      </div>

      <div className="pomodoro-timer-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(126,200,227,0.2)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="48"
            fill="none"
            stroke={PRESETS[preset].color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
          <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--deep-blue-dark)" fontFamily="'M PLUS Rounded 1c',sans-serif">
            {mins}:{secs}
          </text>
          <text x="60" y="76" textAnchor="middle" fontSize="11" fill="var(--ocean-dark)" fontFamily="'M PLUS Rounded 1c',sans-serif">
            {isBreak ? '🐢 休息中' : '🐬 專注中'}
          </text>
        </svg>
      </div>

      <div className="pomodoro-controls">
        <button className="btn btn-primary btn-sm" onClick={() => setRunning(r => !r)}>
          {running ? '⏸ 暫停' : '▶ 開始'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={reset}>⟳ 重置</button>
      </div>

      <div className="pomodoro-settings">
        <label style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 6 }}>音效</label>
        <select value={sound} onChange={e => setSound(e.target.value)} style={{ fontSize: 14, padding: '6px 10px' }}>
          {SOUNDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <label style={{ fontSize: 14, fontWeight: 700, display: 'block', marginTop: 10, marginBottom: 4 }}>
          提醒音長：{alertDuration} 秒
        </label>
        <input
          type="range"
          min="1" max="30"
          value={alertDuration}
          onChange={e => setAlertDuration(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--ocean-blue)' }}
        />

        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 10, width: '100%', fontSize: 13 }}
          onClick={() => playAlert(sound, 3)}
        >
          🔊 試聽音效
        </button>
      </div>
    </div>
  );
}
