import { useState } from 'react';

const PRIORITIES = ['高', '中', '低'];
const CATEGORIES = ['工作', '學習', '生活', '健康', '財務', '其他'];

export default function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    content: task?.content || '',
    priority: task?.priority || '中',
    category: task?.category || '',
    dueDate: task?.dueDate || '',
    status: task?.status || '待處理',
    id: task?.id || null,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { alert('請輸入任務標題'); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22 }}>{task ? '✏️ 編輯任務' : '+ 新增任務'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--deep-blue)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>任務標題 *</label>
            <input
              placeholder="輸入任務標題"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>內容 / 備註</label>
            <textarea
              placeholder="詳細說明（支援換行段落）"
              value={form.content}
              onChange={e => set('content', e.target.value)}
              style={{ minHeight: 100 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>優先級</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p === '高' ? '🔴 高' : p === '中' ? '🟡 中' : '🟢 低'}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>類別</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">無類別</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>截止日期</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 6 }}>狀態</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="待處理">📋 待處理</option>
                <option value="進行中">🔄 進行中</option>
                <option value="已完成">✅ 已完成</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
              {task ? '儲存修改' : '新增任務'} 🌊
            </button>
            <button className="btn btn-ghost" onClick={onClose}>取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}
