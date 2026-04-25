import { useState, useEffect } from 'react';
import LoginFlow from './components/auth/LoginFlow';
import Header from './components/layout/Header';
import CalendarTab from './components/calendar/CalendarTab';
import ProgressTab from './components/progress/ProgressTab';
import TasksTab from './components/tasks/TasksTab';
import SummaryTab from './components/summary/SummaryTab';
import Pomodoro from './components/pomodoro/Pomodoro';

const USER_KEY = 'lingo_username';
const SITE_KEY = 'lingo_site_verified';

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem(USER_KEY) || '');
  const [loggedIn, setLoggedIn] = useState(
    !!(localStorage.getItem(USER_KEY) && localStorage.getItem(SITE_KEY) === 'true')
  );
  const [activeTab, setActiveTab] = useState('calendar');

  const handleLoginDone = (name) => {
    setUsername(name);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SITE_KEY);
    setLoggedIn(false);
    setUsername('');
  };

  if (!loggedIn) {
    return <LoginFlow onDone={handleLoginDone} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        username={username}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {activeTab === 'calendar'  && <CalendarTab  userId={username} />}
        {activeTab === 'progress'  && <ProgressTab  userId={username} />}
        {activeTab === 'tasks'     && <TasksTab     userId={username} />}
        {activeTab === 'summary'   && <SummaryTab   userId={username} />}
      </main>
      <Pomodoro />
    </div>
  );
}
