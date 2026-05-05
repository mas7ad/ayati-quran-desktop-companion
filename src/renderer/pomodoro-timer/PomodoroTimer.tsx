import React, { useEffect, useState } from 'react';
import {
  formatPomodoroClock,
  type PomodoroPetOverlayPayload,
} from '../../shared/pomodoro-client';
import './pomodoro-timer.css';

function kindLabel(kind: PomodoroPetOverlayPayload['kind']): string {
  if (kind === 'shortBreak') return 'Short break';
  if (kind === 'longBreak') return 'Long break';
  return 'Focus';
}

export const PomodoroTimer: React.FC = () => {
  const [data, setData] = useState<PomodoroPetOverlayPayload | null>(null);

  useEffect(() => {
    window.ayati.onPomodoroOverlayUpdate((payload) => {
      setData(payload);
    });
    return () => {
      window.ayati.offPomodoroOverlayUpdate();
    };
  }, []);

  if (!data) {
    return null;
  }

  return (
    <div className="pomodoro-timer-root" aria-live="polite" aria-label="Pomodoro timer">
      <span className="pomodoro-timer-clock">{formatPomodoroClock(data.remainingMs)}</span>
      <span className="pomodoro-timer-meta">
        {kindLabel(data.kind)}
        {data.status === 'paused' ? ' · Paused' : ''}
      </span>
    </div>
  );
};
