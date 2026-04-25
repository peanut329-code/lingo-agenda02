import { useState } from 'react';
import CalendarView from './CalendarView';
import VocabBook from './VocabBook';
import './CalendarTab.css';

export default function CalendarTab({ userId }) {
  const [subTab, setSubTab] = useState('calendar');

  return (
    <div className="animate-fadeInUp">
      <div className="sub-tabs">
        <button className={`sub-tab-btn ${subTab === 'calendar' ? 'active' : ''}`} onClick={() => setSubTab('calendar')}>
          📅 行事曆
        </button>
        <button className={`sub-tab-btn ${subTab === 'vocab' ? 'active' : ''}`} onClick={() => setSubTab('vocab')}>
          📚 單字本
        </button>
      </div>
      {subTab === 'calendar' && <CalendarView userId={userId} />}
      {subTab === 'vocab' && <VocabBook userId={userId} />}
    </div>
  );
}
