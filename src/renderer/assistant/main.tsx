import React from 'react';
import ReactDOM from 'react-dom/client';
import { Assistant } from './Assistant';
import './styles.css';

// #region agent log
const debugLog = (
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) => {
  fetch('http://127.0.0.1:7445/ingest/5150cd8d-c9d2-4c97-b3e9-ffd5b4699b08', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9312c8' },
    body: JSON.stringify({
      sessionId: '9312c8',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
};

class AssistantDebugErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    debugLog('main.tsx:boundary', 'react render error', {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
    }, 'A');
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: '#f87171', fontFamily: 'monospace', fontSize: 12 }}>
          <p>Assistant failed to render:</p>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener('error', (event) => {
  debugLog('main.tsx:window.error', 'uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  }, 'A');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  debugLog('main.tsx:unhandledrejection', 'unhandled promise rejection', {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack?.slice(0, 500) : undefined,
  }, 'B');
});
// #endregion

document.documentElement.classList.add('dark');
document.documentElement.style.colorScheme = 'dark';

// #region agent log
debugLog('main.tsx:boot', 'assistant main boot', {
  hasRoot: Boolean(document.getElementById('root')),
  hasAyati: typeof window.ayati !== 'undefined',
  ayatiKeys: typeof window.ayati !== 'undefined' ? Object.keys(window.ayati).length : 0,
}, 'B');
// #endregion

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AssistantDebugErrorBoundary>
      <Assistant />
    </AssistantDebugErrorBoundary>
  </React.StrictMode>
);
