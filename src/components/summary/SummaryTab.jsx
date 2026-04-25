import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import './SummaryTab.css';

const MOODS = [
  { emoji: '🤩', label: '超棒' },
  { emoji: '😊', label: '開心' },
  { emoji: '🥰', label: '幸福' },
  { emoji: '😌', label: '平靜' },
  { emoji: '😐', label: '普通' },
  { emoji: '😤', label: '煩躁' },
  { emoji: '😢', label: '難過' },
  { emoji: '😴', label: '疲憊' },
];

const MOOD_COLORS = ['#7ec8e3','#a8e6cf','#ffb3a7','#fff3b0','#c9b8e8','#f4956a','#85c1e9','#d7bde2'];

function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getMonthStr(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function getQuarter(d = new Date()) { return Math.floor(d.getMonth() / 3); }

export default function SummaryTab({ userId }) {
  const [entries, setEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newMood, setNewMood] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [viewMonth, setViewMonth] = useState(getMonthStr());

  useEffect(() => {
    if (!userId) return;
    const q1 = query(collection(db, 'mood_entries'), where('userId', '==', userId));
    const q2 = query(collection(db, 'tasks'), where('userId', '==', userId));
    const unsub1 = onSnapshot(q1, snap => setEntries(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsub2 = onSnapshot(q2, snap => setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    return () => { unsub1(); unsub2(); };
  }, [userId]);

  const todayStr = getTodayStr();
  const todayEntries = entries.filter(e => e.date === todayStr);
  const canAdd = todayEntries.length < 2;

  const addEntry = async () => {
    if (!newMood) { alert('請選擇心情'); return; }
    await addDoc(collection(db, 'mood_entries'), {
      userId, date: todayStr, mood: newMood, note: newNote.trim(),
      createdAt: new Date().toISOString(), period: todayEntries.length === 0 ? '早' : '晚'
    });
    setNewMood('');
    setNewNote('');
    setShowForm(false);
  };

  const deleteEntry = async (id) => {
    if (!confirm('確定刪除這筆記錄？')) return;
    await deleteDoc(doc(db, 'mood_entries', id));
  };

  const clearEntries = async (range) => {
    const now = new Date();
    const toDelete = entries.filter(e => {
      if (range === 'all') return true;
      const d = new Date(e.date);
      if (range === 'month') return getMonthStr(d) === getMonthStr(now);
      if (range === 'quarter') return getQuarter(d) === getQuarter(now) && d.getFullYear() === now.getFullYear();
      return false;
    });
    if (!confirm(`確定要清除 ${toDelete.length} 筆記錄？`)) return;
    for (const e of toDelete) await deleteDoc(doc(db, 'mood_entries', e.id));
    setShowClearMenu(false);
  };

  const exportExcel = (range) => {
    const now = new Date();
    let filteredEntries = entries;
    let filteredTasks = tasks.filter(t => t.status === '已完成');

    if (range === 'month') {
      const ms = getMonthStr(now);
      filteredEntries = entries.filter(e => getMonthStr(new Date(e.date)) === ms);
      filteredTasks = filteredTasks.filter(t => t.dueDate && getMonthStr(new Date(t.dueDate)) === ms);
    } else if (range === 'quarter') {
      const q = getQuarter(now);
      filteredEntries = entries.filter(e => {
        const d = new Date(e.date);
        return getQuarter(d) === q && d.getFullYear() === now.getFullYear();
      });
      filteredTasks = filteredTasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return getQuarter(d) === q && d.getFullYear() === now.getFullYear();
      });
    }

    const wb = XLSX.utils.book_new();
    const moodWs = XLSX.utils.json_to_sheet(filteredEntries.map(e => ({
      日期: e.date, 時段: e.period, 心情: e.mood, 備註: e.note || ''
    })));
    const taskWs = XLSX.utils.json_to_sheet(filteredTasks.map(t => ({
      標題: t.title, 類別: t.category || '', 優先級: t.priority, 截止日: t.dueDate || ''
    })));

    XLSX.utils.book_append_sheet(wb, moodWs, '心情記錄');
    XLSX.utils.book_append_sheet(wb, taskWs, '完成任務');
    XLSX.writeFile(wb, `LingoAgenda_${range}_${now.toISOString().slice(0,10)}.xlsx`);
  };

  // 月報統計
  const monthEntries = entries.filter(e => e.date.startsWith(viewMonth));
  const monthTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(viewMonth));
  const monthDone = monthTasks.filter(t => t.status === '已完成');
  const completionRate = monthTasks.length === 0 ? 0 : Math.round((monthDone.length / monthTasks.length) * 100);

  const moodCounts = {};
  MOODS.forEach(m => { moodCounts[m.emoji] = 0; });
  monthEntries.forEach(e => { if (moodCounts[e.mood] !== undefined) moodCounts[e.mood]++; });
  const pieData = MOODS.map((m, i) => ({ name: `${m.emoji} ${m.label}`, value: moodCounts[m.emoji] || 0, color: MOOD_COLORS[i] })).filter(d => d.value > 0);

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="summary-wrap animate-fadeInUp">
      {/* 心情小記 */}
      <div className="card summary-section">
        <div className="section-header">
          <h2 style={{ fontSize: 22 }}>💭 心情小記</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {canAdd && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                {showForm ? '取消' : '+ 新增心情'}
              </button>
            )}
            <div className="clear-menu-wrap" style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowClearMenu(!showClearMenu)}>
                🗑 清除 ▾
              </button>
              {showClearMenu && (
                <div className="clear-dropdown">
                  <button onClick={() => clearEntries('all')}>清除全部</button>
                  <button onClick={() => clearEntries('quarter')}>清除本季</button>
                  <button onClick={() => clearEntries('month')}>清除本月</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!canAdd && (
          <p style={{ fontSize: 16, color: 'var(--ocean-dark)', background: 'rgba(126,200,227,0.1)', padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
            今日已記錄 2 筆心情（早/晚各一筆）🐠
          </p>
        )}

        {showForm && (
          <div className="mood-form animate-fadeInUp">
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
              {todayEntries.length === 0 ? '早晨心情' : '晚間心情'}
            </p>
            <div className="mood-picker">
              {MOODS.map(m => (
                <button
                  key={m.emoji}
                  className={`mood-btn ${newMood === m.emoji ? 'selected' : ''}`}
                  onClick={() => setNewMood(m.emoji)}
                  title={m.label}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>
            <textarea
              placeholder="今天的感受... （可不填）"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              style={{ marginTop: 12 }}
            />
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={addEntry}>
              記錄 🌊
            </button>
          </div>
        )}

        <div className="mood-list">
          {sortedEntries.slice(0, 20).map(e => (
            <div key={e.id} className="mood-entry-card">
              <div className="mood-entry-left">
                <span className="mood-entry-emoji">{e.mood}</span>
                <div>
                  <p className="mood-entry-date">{e.date}（{e.period}）</p>
                  {e.note && <p className="mood-entry-note">{e.note}</p>}
                </div>
              </div>
              <button className="icon-btn" onClick={() => deleteEntry(e.id)}>🗑</button>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="summary-empty">
              <span className="animate-turtle" style={{ fontSize: 36, display: 'inline-block' }}>🐢</span>
              <p>還沒有心情記錄，快來記下今天的心情吧！</p>
            </div>
          )}
        </div>
      </div>

      {/* 匯出 */}
      <div className="card summary-section">
        <h2 style={{ fontSize: 22, marginBottom: 14 }}>📥 匯出資料</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => exportExcel('month')}>🐠 匯出本月 Excel</button>
          <button className="btn btn-ghost" onClick={() => exportExcel('quarter')}>🌊 匯出本季 Excel</button>
          <button className="btn btn-ghost" onClick={() => exportExcel('all')}>📦 匯出全部 Excel</button>
        </div>
      </div>

      {/* 月報統計 */}
      <div className="card summary-section">
        <div className="section-header">
          <h2 style={{ fontSize: 22 }}>📊 月報統計</h2>
          <input
            type="month"
            value={viewMonth}
            onChange={e => setViewMonth(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px', fontSize: 16 }}
          />
        </div>

        <div className="monthly-stats">
          <div className="stat-card">
            <p className="stat-num">{monthDone.length}</p>
            <p className="stat-label">完成任務</p>
          </div>
          <div className="stat-card">
            <p className="stat-num">{completionRate}%</p>
            <p className="stat-label">待辦完成率</p>
          </div>
          <div className="stat-card">
            <p className="stat-num">{monthEntries.length}</p>
            <p className="stat-label">心情記錄</p>
          </div>
        </div>

        <div className="completion-bar-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>待辦完成率</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{monthDone.length}/{monthTasks.length}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {pieData.length > 0 ? (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>心情分布</p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={13}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} 次`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="summary-empty" style={{ marginTop: 16 }}>
            <span style={{ fontSize: 32 }}>🪼</span>
            <p>本月尚無心情記錄</p>
          </div>
        )}
      </div>
    </div>
  );
}
