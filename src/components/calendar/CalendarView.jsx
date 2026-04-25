import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './CalendarView.css';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function CalendarView({ userId }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#7ec8e3');

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'events'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  }, [userId]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const addEvent = async () => {
    if (!newTitle.trim() || !selected) return;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`;
    await addDoc(collection(db, 'events'), { userId, date: dateStr, title: newTitle.trim(), color: newColor });
    setNewTitle('');
    setShowAdd(false);
  };

  const removeEvent = async (id) => {
    await deleteDoc(doc(db, 'events', id));
  };

  const selectedEvents = selected ? getEventsForDay(selected) : [];

  return (
    <div className="calendar-wrap card">
      <div className="cal-header">
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>◀</button>
        <h2 style={{ fontSize: 22, color: 'var(--deep-blue-dark)' }}>{year}年 {MONTHS[month]}</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>▶</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}>今月</button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day}
              className={`cal-cell ${isToday(day) ? 'today' : ''} ${selected === day ? 'selected' : ''}`}
              onClick={() => { setSelected(day); setShowAdd(false); }}
            >
              <span className="cal-day-num">{day}</span>
              {dayEvents.length === 0 && isToday(day) && <span style={{ fontSize: 10 }}>🐢</span>}
              <div className="cal-dots">
                {dayEvents.slice(0, 3).map(e => (
                  <span key={e.id} className="cal-dot" style={{ background: e.color || '#7ec8e3' }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="cal-detail animate-fadeInUp">
          <div className="cal-detail-header">
            <h3 style={{ fontSize: 20 }}>
              {month+1}/{selected}（{WEEKDAYS[new Date(year, month, selected).getDay()]}）的行程
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? '取消' : '+ 新增'}
            </button>
          </div>

          {showAdd && (
            <div className="cal-add-form">
              <input
                placeholder="行程標題"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEvent()}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 16, whiteSpace: 'nowrap' }}>顏色：</label>
                {['#7ec8e3','#ffb3a7','#a8e6cf','#fff3b0','#c9b8e8','#f4956a'].map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: newColor === c ? '3px solid var(--deep-blue)' : '2px solid transparent',
                    cursor: 'pointer'
                  }} />
                ))}
              </div>
              <button className="btn btn-primary" onClick={addEvent}>確認新增</button>
            </div>
          )}

          {selectedEvents.length === 0 && !showAdd && (
            <div className="cal-empty">
              <span className="animate-turtle" style={{ fontSize: 36, display: 'inline-block' }}>🐢</span>
              <p>今日還沒有行程，悠閒的一天～</p>
            </div>
          )}

          {selectedEvents.map(e => (
            <div key={e.id} className="cal-event-item" style={{ borderLeft: `4px solid ${e.color || '#7ec8e3'}` }}>
              <span style={{ fontSize: 17 }}>{e.title}</span>
              <button onClick={() => removeEvent(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: 0.5 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
