import { useCallback, useEffect, useMemo, useState } from 'react';
import HistoryList from './components/HistoryList.jsx';
import ResultDisplay from './components/ResultDisplay.jsx';

const HISTORY_KEY = 'smart-study-history';
const THEME_KEY = 'smart-study-theme';

// Detect if we're in development mode (localhost)
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// In development, always use proxy (relative path)
// In production, use VITE_API_BASE_URL if set, otherwise use relative path
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Clean up the API base URL: remove trailing slashes and any path segments (like /health)
const cleanApiBaseUrl = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    // Keep only the origin (protocol + hostname + port), remove any path
    return urlObj.origin;
  } catch {
    // If URL parsing fails, try simple string replacement
    return url.replace(/\/+$/, '').split('/').slice(0, 3).join('/');
  }
};

const API_BASE_URL = isDevelopment ? '' : (RAW_API_BASE_URL ? cleanApiBaseUrl(RAW_API_BASE_URL) : '');

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Unable to load history from localStorage', error);
    return [];
  }
}

function persistHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Unable to persist history', error);
  }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function persistTheme(mode) {
  localStorage.setItem(THEME_KEY, mode);
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [mathMode, setMathMode] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => loadHistory());
  const [theme, setTheme] = useState(() => loadTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    persistTheme(theme);
  }, [theme]);

  const submitDisabled = useMemo(() => !topic.trim() || loading, [topic, loading]);

  const updateHistory = useCallback(
    (nextTopic) => {
      setHistory((prev) => {
        const deduped = [nextTopic, ...prev.filter((item) => item !== nextTopic)].slice(0, 5);
        persistHistory(deduped);
        return deduped;
      });
    },
    [],
  );

  const fetchStudyData = useCallback(
    async (targetTopic, mode) => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ topic: targetTopic });
      if (mode === 'math') {
        params.set('mode', 'math');
      }

      try {
        const endpoint = API_BASE_URL ? `${API_BASE_URL}/study` : '/study';
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const payloadText = await response.text();
        let data = {};

        // Try to parse JSON, but handle non-JSON responses gracefully
        if (payloadText) {
          try {
            data = JSON.parse(payloadText);
          } catch (parseError) {
            // If it's not JSON, use the text as the message
            console.warn('Non-JSON response:', payloadText);
            if (!response.ok) {
              throw new Error(payloadText || `Server returned ${response.status} ${response.statusText}`);
            }
          }
        }

        if (!response.ok) {
          let errorMessage = data.message || data.error || payloadText || `Request failed with status ${response.status}`;
          
          // Provide helpful message for 401 errors (likely Vercel deployment protection)
          if (response.status === 401) {
            errorMessage = 'Backend requires authentication. Please disable deployment protection in Vercel project settings, or use a production URL without protection.';
          }
          
          throw new Error(errorMessage);
        }

        setResult(data);
        updateHistory(targetTopic);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Something went wrong');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [updateHistory],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Please enter a topic.');
      return;
    }

    const mode = mathMode ? 'math' : 'default';
    await fetchStudyData(trimmedTopic, mode);
  };

  const handleHistorySelect = (item) => {
    setTopic(item);
    fetchStudyData(item, mathMode ? 'math' : 'default');
  };

  const handleClearHistory = () => {
    setHistory([]);
    persistHistory([]);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app">
      <header>
        <h1>Smart Study Assistant</h1>
        <button type="button" className="link-button" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="topic-input">Study Topic</label>
        <input
          id="topic-input"
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g., Photosynthesis"
        />

        <div className="form-row">
          <label htmlFor="math-mode" className="checkbox">
            <input
              id="math-mode"
              type="checkbox"
              checked={mathMode}
              onChange={(event) => setMathMode(event.target.checked)}
            />
            Math Mode
          </label>
        </div>

        <button type="submit" disabled={submitDisabled}>
          {loading ? 'Generating...' : 'Get Study Pack'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <HistoryList items={history} onSelect={handleHistorySelect} onClear={handleClearHistory} />

      {loading && (
        <div className="overlay">
          <div className="spinner" />
          <p>Preparing your study materials...</p>
        </div>
      )}

      <ResultDisplay result={result} />
    </div>
  );
}
