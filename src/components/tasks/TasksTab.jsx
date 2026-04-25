import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import TaskModal from './TaskModal';
import './TasksTab.css';

const COLUMNS = ['待處理', '進行中', '已完成'];
const COL_EMOJI = { '待處理': '📋', '進行中': '🔄', '已完成': '✅' };
const COL_COLOR = { '待處理': 'rgba(247,251,255,1)', '進行中': 'rgba(223,241,251,0.6)', '已完成': 'rgba(168,230,207,0.25)' };

export default function TasksTab({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showClearMenu, setShowClearMenu] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  }, [userId]);

  const saveTask = async (data) => {
    try {
      if (data.id) {
        await updateDoc(doc(db, 'tasks', data.id), data);
      } else {
        const { id: _id, ...dataToSave } = data;
        await addDoc(collection(db, 'tasks'), { ...dataToSave, userId, createdAt: new Date().toISOString() });
      }
      setShowModal(false);
      setEditTask(null);
    } catch (e) {
      console.error('saveTask error:', e);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('確定要刪除這個任務嗎？')) return;
    await deleteDoc(doc(db, 'tasks', id));
  };

  const moveTask = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { status: newStatus });
    } catch (e) {
      console.error('moveTask error:', e);
    }
  };

  const clearDone = async (range) => {
    const now = new Date();
    const doneTasks = tasks.filter(t => t.status === '已完成');
    const toDelete = doneTasks.filter(t => {
      if (range === 'all') return true;
      const created = new Date(t.createdAt || t.dueDate || now);
      if (range === 'month') {
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }
      if (range === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        const cq = Math.floor(created.getMonth() / 3);
        return cq === q && created.getFullYear() === now.getFullYear();
      }
      return false;
    });
    if (!confirm(`確定要清除 ${toDelete.length} 筆已完成任務？`)) return;
    for (const t of toDelete) await deleteDoc(doc(db, 'tasks', t.id));
    setShowClearMenu(false);
  };

  const PriorityBadge = ({ p }) => {
    if (p === '高') return <span className="badge badge-coral">🔴 高</span>;
    if (p === '中') return <span className="badge badge-yellow">🟡 中</span>;
    return <span className="badge badge-mint">🟢 低</span>;
  };

  return (
    <div className="tasks-wrap animate-fadeInUp">
      <div className="tasks-toolbar">
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
          + 新增任務
        </button>
        <div className="clear-menu-wrap">
          <button className="btn btn-ghost" onClick={() => setShowClearMenu(!showClearMenu)}>
            🗑 清除已完成 ▾
          </button>
          {showClearMenu && (
            <div className="clear-dropdown">
              <button onClick={() => clearDone('all')}>清除全部已完成</button>
              <button onClick={() => clearDone('quarter')}>清除本季已完成</button>
              <button onClick={() => clearDone('month')}>清除本月已完成</button>
            </div>
          )}
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          return (
            <div key={col} className="kanban-col" style={{ background: COL_COLOR[col] }}>
              <div className="kanban-col-header">
                <span style={{ fontSize: 20 }}>{COL_EMOJI[col]}</span>
                <h3 style={{ fontSize: 20 }}>{col}</h3>
                <span className="kanban-count">{colTasks.length}</span>
              </div>

              <div className="kanban-cards">
                {colTasks.length === 0 && (
                  <div className="kanban-empty">
                    {col === '待處理' ? '🐠 空空如也' : col === '進行中' ? '🌊 準備出發' : '🐢 尚無完成'}
                  </div>
                )}
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className={`kanban-card priority-${task.priority === '高' ? 'high' : task.priority === '中' ? 'mid' : 'low'}`}
                  >
                    <div className="kanban-card-top">
                      <p className="kanban-card-title">{task.title}</p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" onClick={() => { setEditTask(task); setShowModal(true); }} title="編輯">✏️</button>
                        <button className="icon-btn" onClick={() => deleteTask(task.id)} title="刪除">🗑</button>
                      </div>
                    </div>

                    {task.content && (
                      <p className="kanban-card-content">{task.content}</p>
                    )}

                    <div className="kanban-card-meta">
                      <PriorityBadge p={task.priority} />
                      {task.category && <span className="badge badge-blue">{task.category}</span>}
                      {task.dueDate && (
                        <span className="badge badge-purple">📅 {task.dueDate}</span>
                      )}
                    </div>

                    <div className="kanban-card-actions">
                      {COLUMNS.filter(c => c !== col).map(c => (
                        <button key={c} className="btn btn-ghost btn-sm" onClick={() => moveTask(task.id, c)}>
                          → {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {col === '待處理' && (
                <button
                  className="btn btn-ghost btn-sm kanban-add-btn"
                  onClick={() => { setEditTask(null); setShowModal(true); }}
                >
                  + 新增
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          onSave={saveTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}
