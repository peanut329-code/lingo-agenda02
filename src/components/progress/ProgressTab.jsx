import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './ProgressTab.css';

function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const WEEKDAY_ZH = ['日','一','二','三','四','五','六'];

export default function ProgressTab({ userId }) {
  const [tasks, setTasks] = useState([]);
  const todayStr = getDateStr(0);
  const tomorrowStr = getDateStr(1);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  }, [userId]);

  const todayTasks = tasks.filter(t =>
    t.status !== '已完成' && (
      t.dueDate === todayStr ||
      (t.status === '進行中' && !t.dueDate)
    )
  );
  const todayDone = tasks.filter(t => t.dueDate === todayStr && t.status === '已完成');
  const tomorrowTasks = tasks.filter(t => t.dueDate === tomorrowStr && t.status !== '已完成');

  const todayTotal = todayTasks.length + todayDone.length;
  const todayRate = todayTotal === 0 ? 0 : Math.round((todayDone.length / todayTotal) * 100);

  const toggleDone = async (task) => {
    const newStatus = task.status === '已完成' ? '待處理' : '已完成';
    await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
  };

  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  const PriorityBadge = ({ p }) => {
    if (p === '高') return <span className="badge badge-coral">🔴 高</span>;
    if (p === '中') return <span className="badge badge-yellow">🟡 中</span>;
    return <span className="badge badge-mint">🟢 低</span>;
  };

  const TaskCard = ({ task }) => (
    <div className={`progress-task-card priority-${task.priority === '高' ? 'high' : task.priority === '中' ? 'mid' : 'low'}`}>
      <label className="task-check-row">
        <input type="checkbox" checked={task.status === '已完成'} onChange={() => toggleDone(task)} />
        <span className={`task-title-text ${task.status === '已完成' ? 'done-text' : ''}`}>{task.title}</span>
      </label>
      <div className="task-meta">
        <PriorityBadge p={task.priority} />
        {task.category && <span className="badge badge-blue">{task.category}</span>}
      </div>
    </div>
  );

  return (
    <div className="progress-wrap animate-fadeInUp">
      <div className="progress-today-bar card">
        <div className="progress-bar-header">
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            今日完成率
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ocean-dark)' }}>
            {todayRate}%
          </span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${todayRate}%` }} />
        </div>
        <p style={{ fontSize: 16, color: 'var(--ocean-dark)', marginTop: 6 }}>
          完成 {todayDone.length} / 共 {todayTotal} 項任務
        </p>
      </div>

      <div className="progress-columns">
        <div className="progress-col card">
          <div className="progress-col-header today-header">
            <h2 style={{ fontSize: 22 }}>
              今日 {today.getMonth()+1}/{today.getDate()}（{WEEKDAY_ZH[today.getDay()]}）
            </h2>
            <span className="badge badge-coral">{todayTasks.length} 項待辦</span>
          </div>
          <div className="wave-divider" style={{ margin: '10px 0 14px' }} />
          {todayTasks.length === 0 && todayDone.length === 0 ? (
            <div className="progress-empty">
              <span className="animate-turtle" style={{ fontSize: 40, display: 'inline-block' }}>🐢</span>
              <p>今日無待辦，悠遊自在 🌊</p>
            </div>
          ) : (
            <>
              {todayTasks.map(t => <TaskCard key={t.id} task={t} />)}
              {todayDone.map(t => <TaskCard key={t.id} task={t} />)}
            </>
          )}
        </div>

        <div className="progress-col card">
          <div className="progress-col-header tomorrow-header">
            <h2 style={{ fontSize: 22 }}>
              明日 {tomorrow.getMonth()+1}/{tomorrow.getDate()}（{WEEKDAY_ZH[tomorrow.getDay()]}）
            </h2>
            <span className="badge badge-blue">{tomorrowTasks.length} 項待辦</span>
          </div>
          <div className="wave-divider" style={{ margin: '10px 0 14px' }} />
          {tomorrowTasks.length === 0 ? (
            <div className="progress-empty">
              <span style={{ fontSize: 40 }}>🐬</span>
              <p>明日目前無任務安排</p>
            </div>
          ) : (
            tomorrowTasks.map(t => <TaskCard key={t.id} task={t} />)
          )}
        </div>
      </div>
    </div>
  );
}
