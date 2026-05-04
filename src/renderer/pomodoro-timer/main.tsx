import React from 'react';
import ReactDOM from 'react-dom/client';
import { PomodoroTimer } from './PomodoroTimer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PomodoroTimer />
  </React.StrictMode>,
);
