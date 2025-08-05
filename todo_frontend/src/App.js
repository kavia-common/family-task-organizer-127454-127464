import React, { useEffect, useState } from 'react';
import './App.css';

// --- Utility Functions ---
// Simulate getting token, replace with real auth/storage
function getToken() {
  return localStorage.getItem('fto_token');
}
function setToken(token) {
  localStorage.setItem('fto_token', token);
}
function removeToken() {
  localStorage.removeItem('fto_token');
}
function getApiUrl(path) {
  // Normally use a .env for REACT_APP_API_URL, fallback for dev here:
  const base = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  return `${base}${path}`;
}

// --- Child-Friendly Avatar/Icon ---
function Avatar({ name, role }) {
  // Simple illustrated avatars, can later swap for images
  const color = role === 'parent' ? '#FFA500' : '#2196F3';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
        lineHeight: '38px',
        textAlign: 'center',
        marginRight: 8,
        border: '2px solid #FFD600'
      }}
      title={name}
    >
      {name ? name.charAt(0).toUpperCase() : '?'}
    </span>
  );
}

// --- API Wrappers ---
// All API functions assume Express backend defined with REST routes
async function apiLogin(email, password) {
  const res = await fetch(getApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  return data; // { token, user: {name, role, ...} }
}
async function apiSignup(name, email, password, role) {
  const res = await fetch(getApiUrl('/api/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) throw new Error('Signup failed');
  return await res.json();
}
// Authenticated requests: attach JWT token
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(getApiUrl(path), {
    ...opts,
    headers: {
      ...((opts && opts.headers) || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return await res.json();
}

// PUBLIC_INTERFACE
// Main App component controls global state, routing, theme
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null); // {name, email, role}
  const [loading, setLoading] = useState(true);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Try token-based auth on load
  useEffect(() => {
    async function fetchProfile() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Hit profile endpoint
        const data = await apiFetch('/api/auth/profile');
        setUser(data.user);
      } catch {
        removeToken();
        setUser(null);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (loading) {
    return <div className="App"><header className="App-header"><span>Loading...</span></header></div>;
  }

  return (
    <div className="App">
      <header className="App-header" style={{minHeight: 'auto'}}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1
          style={{
            color: 'var(--text-primary)',
            margin: 16,
            letterSpacing: 2,
            fontFamily: "'Comic Sans MS', 'Comic Sans', cursive",
          }}
        >
          Family Task Organizer
        </h1>
        {!user ? (
          <AuthPanel onAuth={u => setUser(u)} />
        ) : (
          <Dashboard user={user} onLogout={() => { removeToken(); setUser(null); }} />
        )}
        <div style={{height: 16}} />
        <MotivationalBanner />
      </header>
    </div>
  );
}

// --- Authentication Panel (Login/Signup) ---
function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('kid');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const data = await apiLogin(email, password);
        setToken(data.token);
        onAuth(data.user);
      } else {
        await apiSignup(name, email, password, role);
        // Auto-login on signup
        const data = await apiLogin(email, password);
        setToken(data.token);
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-panel" style={{
      background: 'var(--bg-secondary)',
      borderRadius: 18,
      padding: 32,
      maxWidth: 330,
      margin: 'auto',
      marginTop: 24,
      boxShadow: '0 2px 8px #d0d0d080',
    }}>
      <div>
        <button
          className="btn"
          onClick={() => setMode('login')}
          style={{
            marginRight: 12,
            fontWeight: mode === 'login' ? 'bold' : 'normal',
            borderBottom: mode === 'login' ? '2px solid #4CAF50' : 'none',
            color: mode === 'login' ? '#2196F3' : '#666'
          }}
        >Log In</button>
        <button
          className="btn"
          onClick={() => setMode('signup')}
          style={{
            fontWeight: mode === 'signup' ? 'bold' : 'normal',
            borderBottom: mode === 'signup' ? '2px solid #FFD600' : 'none',
            color: mode === 'signup' ? '#FFA500' : '#666'
          }}
        >Sign Up</button>
      </div>
      <form onSubmit={handleSubmit} style={{marginTop: 24}} autoComplete="off">
        {mode === 'signup' && (
          <>
            <input
              name="name"
              type="text"
              placeholder="First Name"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{width: '100%', marginBottom: 12, padding: 10, borderRadius: 6}}
            />
          </>
        )}
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="Email"
          className="input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{width: '100%', marginBottom: 12, padding: 10, borderRadius: 6}}
        />
        <input
          name="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="Password"
          className="input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={4}
          style={{width: '100%', marginBottom: 12, padding: 10, borderRadius: 6}}
        />
        {mode === 'signup' && (
          <div style={{marginBottom: 12}}>
            I am:&nbsp;
            <label>
              <input
                type="radio"
                name="role"
                value="parent"
                checked={role === 'parent'}
                onChange={() => setRole('parent')}
              /> Parent
            </label>
            &nbsp;|&nbsp;
            <label>
              <input
                type="radio"
                name="role"
                value="kid"
                checked={role === 'kid'}
                onChange={() => setRole('kid')}
              /> Kid
            </label>
          </div>
        )}
        {error && <div style={{color: '#fa8072', marginBottom: 10}}>{error}</div>}
        <button
          className="btn"
          type="submit"
          disabled={loading}
          style={{width: '100%', padding: 12, background: '#4CAF50', color: '#fff', fontWeight: 600, borderRadius: 8}}
        >
          {mode === 'login' ? (loading ? 'Logging In...' : 'Log In') : (loading ? 'Signing Up...' : 'Sign Up')}
        </button>
      </form>
    </div>
  );
}

// --- Dashboard with role-based views ---
function Dashboard({ user, onLogout }) {
  // State
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [progress, setProgress] = useState({completed: 0, total: 0});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lookahead, setLookahead] = useState('');
  const [newTask, setNewTask] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [users, setUsers] = useState([]);
  const [motivationalTip, setMotivationalTip] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Load everything on mount
  useEffect(() => { loadEverything(); }, []);
  const loadEverything = async () => {
    setRefreshing(true);
    try {
      const [
        allTasks, allTemplates, allSuggestions, allUsers, tip
      ] = await Promise.all([
        apiFetch('/api/tasks'),
        apiFetch('/api/templates'),
        apiFetch('/api/suggestions'),
        apiFetch('/api/users'),
        apiFetch('/api/tips/random'),
      ]);
      setTasks(allTasks.tasks || []);
      setTemplates(allTemplates.templates || []);
      setSuggestions(allSuggestions.suggestions || []);
      setUsers(allUsers.users || []);
      setMotivationalTip(tip.tip || '');
      setProgress({
        completed: (allTasks.tasks || []).filter(t => t.completed).length,
        total: (allTasks.tasks || []).length,
      });
    } catch (e) {
      setError(e.message || 'Failed to load data');
    }
    setRefreshing(false);
  };

  // Lookahead suggestion handler
  useEffect(() => {
    if (newTask.length > 1) {
      (async () => {
        try {
          const data = await apiFetch(`/api/lookahead?input=${encodeURIComponent(newTask)}`);
          setLookahead(data.suggestion || '');
        } catch { setLookahead(''); }
      })();
    } else setLookahead('');
  }, [newTask]);

  // Handler: Add new task
  async function handleNewTask(e) {
    e.preventDefault();
    setError('');
    try {
      const body = { title: newTask };
      if (assignTo) {
        body.assignedTo = assignTo;
      }
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setNewTask('');
      setAssignTo('');
      await loadEverything();
    } catch (e) {
      setError(e.message || 'Failed to add task');
    }
  }

  // Handler: use template
  async function handleUseTemplate(template) {
    setSelectedTemplate(template);
    setNewTask(template.title);
    setAssignTo(user.role === 'parent' ? template.assignedTo || '' : user.name);
  }

  // Handler: complete a task
  async function handleToggleTask(taskId, completed) {
    try {
      await apiFetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !completed }),
      });
      await loadEverything();
    } catch (e) {
      setError(e.message || 'Failed to update task');
    }
  }

  // Handler: delete a task
  async function handleDeleteTask(taskId) {
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      await loadEverything();
    } catch (e) {
      setError(e.message || 'Failed to delete task');
    }
  }

  // --- Role-specific Content ---
  // Parent can assign tasks to anyone; kids only see and update their own
  const kidMode = user.role === 'kid';

  return (
    <div className="dashboard" style={{
      margin: 0, padding: 0, width: '100%',
      maxWidth: 1100, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <div style={{width: '100%', marginBottom: 10}}>
        <span style={{float:'right', margin: 4}}>
          <Avatar name={user.name} role={user.role} />
          <span style={{marginRight: 16, color:'#2196F3', fontWeight:600}}>
            {user.name} ({user.role})
          </span>
          <button className="btn" onClick={onLogout} style={{background:'#ffd600', color:'#333', fontWeight:'bold', borderRadius:6, padding:8}}>Log Out</button>
        </span>
        <h2 style={{marginBottom:0, marginTop:0, fontFamily:"'Comic Sans MS', 'Comic Sans', cursive", color:'#4CAF50'}}>
          {kidMode ? "My To-Do List" : "Family Dashboard"}
        </h2>
      </div>
      {/* Motivational stats */}
      <MotivationalStats completed={progress.completed} total={progress.total} />
      {/* Notification/error */}
      {error && <div style={{color:'#fa8072', fontWeight:'bold', margin:8}}>{error}</div>}
      <div className="dashboard-content" style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: 'center',
        marginTop: 16,
        gap: 16,
      }}>
        {/* Tasks Area */}
        <div style={{flexBasis:'420px', flexGrow:1, background:'#fffbe9', borderRadius:14, boxShadow:'0 2px 8px #d0d080', padding:20, marginBottom:16, minWidth:300}}>
          <h3 style={{color:'#FF9800',marginTop:0}}>{kidMode ? "My Tasks" : "All Tasks"}</h3>
          {refreshing ? <div>Refreshing...</div> : (
            <TaskList
              tasks={tasks.filter(
                t => kidMode ? t.assignedTo === user.name : true
              )}
              user={user}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          )}
          <form onSubmit={handleNewTask} style={{marginTop:14, display:'flex', flexDirection:'column', gap:5}}>
            <label htmlFor="new-task-input" style={{fontWeight:'bold', marginBottom:2}}>Add New Task:</label>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <input
                id="new-task-input"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder={lookahead ? lookahead : "e.g. Feed the cat"}
                required
                style={{flex:1, marginRight:6, borderRadius:10, padding:10, fontSize:16}}
                autoComplete="off"
              />
              {!kidMode && (
                <select
                  value={assignTo}
                  onChange={e => setAssignTo(e.target.value)}
                  style={{marginRight:4, borderRadius:8, padding:7, background:'#faf6b0'}}
                >
                  <option value="">Assign to...</option>
                  {users.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                </select>
              )}
              <button type="submit" className="btn" style={{padding:'8px 14px', background:'#4CAF50', color:'#fff', marginLeft:2}}>
                Add
              </button>
            </div>
          </form>
          {/* Lookahead Suggestion/Typing */}
          {lookahead && <div style={{color:'#61dafb', fontStyle:'italic', fontSize:12, marginTop:2}}>Suggestion: {lookahead}</div>}
        </div>
        {/* Templates */}
        <div style={{flexBasis:'280px', background:'#E3F2FD', borderRadius:14, boxShadow:'0 2px 8px #b0d0fa80', padding:20, minWidth:210}}>
          <h3 style={{color:'#2196F3',marginTop:0}}>Task Templates</h3>
          {templates.length === 0 ? <div>
            <small>No templates yet.</small>
          </div> : (
            <ul style={{listStyle:'none',padding:0, margin:0}}>
              {templates.map(tmpl => (
                <li key={tmpl.id} style={{marginBottom:8}}>
                  <button className="btn btn-sm" style={{
                    fontSize:15,
                    padding:'8px 14px',
                    background:'#8bc34a',
                    color:'#fff',
                    borderRadius:12,
                    whiteSpace:'normal',
                    marginBottom: 6
                  }} onClick={() => handleUseTemplate(tmpl)}>
                    {tmpl.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Suggestions/Motivation */}
        <div style={{flexBasis:'220px', background:'#FFF9C4', borderRadius:14, boxShadow:'0 2px 8px #ffe600a0', padding:20, minWidth:180}}>
          <h3 style={{color:'#FFD600',marginTop:0}}>Suggestions</h3>
          {suggestions.length === 0 ? <div>
            <small>No suggestions yet.</small>
          </div> : (
            <ul style={{listStyle:'disc', margin:'10px 0 0 18px'}}>
              {suggestions.slice(0,3).map((sug, idx) => (<li key={idx}>{sug.text}</li>))}
            </ul>
          )}
          <div style={{
            marginTop:24,
            fontSize:14,
            color:"#FF7043",
            fontWeight:600,
            background:"#FFF3E0",
            borderRadius:8,
            padding:10,
          }}>
            {motivationalTip}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Task List with Card View ---
function TaskList({ tasks, user, onToggle, onDelete }) {
  if (!tasks.length) return (
    <div style={{margin:10, textAlign:'center', color:'#bbb'}}>
      <img src="https://cdn-icons-png.flaticon.com/128/2919/2919600.png" alt="No tasks" width={48} style={{opacity:.5}}/><br/>
      Yay, nothing to do!
    </div>
  );
  return (
    <div className="task-list" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginTop: 6,
    }}>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          mine={user.name === task.assignedTo}
          canEdit={user.role === 'parent' || user.name === task.assignedTo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// --- Task Card: Engaging, Child-Friendly ---
function TaskCard({ task, mine, canEdit, onToggle, onDelete }) {
  const rainbow = [
    '#FFD600', '#FF9800', '#4CAF50', '#2196F3', '#E040FB', '#FF1744', '#76FF03'
  ];
  return (
    <div style={{
      background: mine
        ? 'linear-gradient(90deg, #e1ffe6 0%, #B9F6CA 100%)'
        : 'linear-gradient(90deg, #FAFAFA 0%, #B3E5FC 100%)',
      borderLeft: `9px solid ${rainbow[task.id % rainbow.length]}`,
      borderRadius: 12,
      margin: '5px 0',
      padding: '14px 12px 7px 12px',
      position: 'relative',
      boxShadow: task.completed ? '0 0 6px #c8e6c9' : '0 2px 8px #eee',
      opacity: task.completed ? 0.65 : 1,
      display: 'flex',
      alignItems: 'center'
    }}>
      <span style={{fontSize:18, marginRight:7, opacity:0.9}}>
        {task.completed ? '✅' : mine ? '🦸‍♂️' : '🎯'}
      </span>
      <div style={{
        flexGrow:1,
        textDecoration: task.completed ? 'line-through' : 'none',
        fontSize:18,
        color: mine ? '#08771a' : '#444'
      }}>
        {task.title}
        <span style={{fontSize:13, marginLeft:10, color:'#888'}}>
          {mine ? '(Me)' : ''}
        </span>
        <div style={{fontSize:12, color:'#888', marginTop:2}}>
          {task.assignedTo && 'Assigned to: ' + task.assignedTo}
        </div>
      </div>
      <button
        className="btn"
        aria-label={!task.completed ? 'Mark as complete' : 'Mark as incomplete'}
        onClick={() => canEdit && onToggle(task.id, task.completed)}
        style={{
          borderRadius: '50%',
          padding: 0,
          width: 32,
          height: 32,
          background: task.completed ? '#ffd600' : '#ff9800',
          color: '#fff', border: 'none', marginRight:6
        }}
        disabled={!canEdit}
      >
        {!task.completed ? '✔️' : '↩️'}
      </button>
      {canEdit && (
        <button
          className="btn"
          aria-label="Delete"
          onClick={() => window.confirm('Delete this task?') && onDelete(task.id)}
          style={{
            borderRadius: '50%',
            padding: 0,
            width: 28,
            height: 28,
            background: '#e53935',
            color: '#fff',
            border: 'none',
          }}
        >🗑️</button>
      )}
    </div>
  );
}

// --- Motivational Banner/Quotes ---
function MotivationalBanner() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // Example static. Backend could deliver random/inspirational quote.
    const messages = [
      "🎈 Let's conquer our day, one task at a time!",
      'Every big journey starts with a little step. 🚀',
      "Together, we've got this! 🌟",
      'Small acts become big wins for our family.',
      'Who will win the Task Star today? ⭐'
    ];
    setMsg(messages[Math.floor(Math.random() * messages.length)]);
  }, []);
  return (
    <div style={{
      background: 'linear-gradient(90deg, #4CAF50 0%, #FFD600 100%)',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 18,
      borderRadius: 10,
      margin: '16px auto 0 auto',
      padding: '12px 18px',
      maxWidth: 500,
      boxShadow: '0 1px 8px #4caf5040'
    }}>
      {msg}
    </div>
  );
}

// --- Motivational Stats (e.g., child-friendly progress) ---
function MotivationalStats({ completed, total }) {
  return (
    <div style={{
      margin: '8px auto',
      marginBottom: 0,
      padding: 6,
      color: '#6d6675',
      fontSize: 14,
      borderRadius: 10,
      display: 'inline-block',
      background: '#e1ffe6',
      boxShadow: '0 1px 3px #ddddddcf'
    }}>
      <strong>Progress: </strong>
      {total > 0 ? (
        <span>
          <span style={{fontSize:18, color:'#4CAF50'}}>{completed} </span>
          of {total} tasks done! &nbsp;
          {completed === total
            ? <span style={{color:'#FFD600', fontWeight:'bold'}}>🎉 All done!</span>
            : <span style={{color:'#2196F3', fontWeight:'bold'}}>{'⭐'.repeat(completed)}</span>}
        </span>
      ) : (
        <span>No tasks yet. Let’s get started!</span>
      )}
    </div>
  );
}

export default App;
