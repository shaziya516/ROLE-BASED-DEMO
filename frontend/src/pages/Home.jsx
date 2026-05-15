import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function statusLabel(status) {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'done') return 'Done';
  return 'To Do';
}

function TaskRow({ task }) {
  return (
    <article className={`task-item ${isOverdue(task) ? 'overdue' : ''}`}>
      <h3>{task.title}</h3>
      {task.description && <p className="desc">{task.description}</p>}
      <p className="task-meta">
        <span className={`status-badge status-${task.status}`}>{statusLabel(task.status)}</span>
        {' | Project: '}
        <Link to={`/projects/${task.project?._id || task.project}`}>
          {task.project?.name || 'Unknown'}
        </Link>
        {task.dueDate && (
          <>
            {' | Due: '}
            {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue(task) && <span className="overdue-text"> (Overdue)</span>}
          </>
        )}
      </p>
    </article>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/tasks'), api.get('/tasks/my')])
      .then(([p, t, m]) => {
        setProjects(p.data.projects);
        setTasks(t.data.tasks);
        setMyTasks(m.data.tasks);
      })
      .catch(() => setError('Could not load data'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(isOverdue).length
  };

  const myStats = {
    total: myTasks.length,
    overdue: myTasks.filter(isOverdue).length
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api.post('/projects', { name, description, status: 'active' });
      setProjects([r.data.project, ...projects]);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const taskCount = (projectId) =>
    tasks.filter(t => (t.project?._id || t.project) === projectId).length;

  return (
    <>
      <header className="header">
        <h1>Team Task Manager</h1>
        <div className="header-right">
          <span>{user.name}</span>
          <span className={`role-tag ${user.role}`}>{user.role}</span>
          <button className="btn btn-small" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="main">
        {error && <div className="error">{error}</div>}

        <div className="stats-row">
          <div className="stat-box"><strong>{stats.total}</strong><span>Total Tasks</span></div>
          <div className="stat-box"><strong>{stats.todo}</strong><span>To Do</span></div>
          <div className="stat-box"><strong>{stats.inProgress}</strong><span>In Progress</span></div>
          <div className="stat-box done"><strong>{stats.done}</strong><span>Done</span></div>
          <div className="stat-box overdue"><strong>{stats.overdue}</strong><span>Overdue</span></div>
        </div>

        <section className="card your-tasks-card">
          <h2>Your Tasks</h2>
          <p className="sub">Tasks assigned to you ({myStats.total})</p>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : myTasks.length === 0 ? (
            <p className="empty">No tasks assigned to you yet.</p>
          ) : (
            <>
              {myStats.overdue > 0 && (
                <p className="member-note">{myStats.overdue} overdue task(s) need attention.</p>
              )}
              {myTasks.map(task => (
                <TaskRow key={task._id} task={task} />
              ))}
            </>
          )}
        </section>

        {!isAdmin && (
          <p className="member-note">You are a Member. You can view projects and tasks but only Admin can make changes.</p>
        )}

        {isAdmin && (
          <section className="card">
            <h2>Create Project</h2>
            <form onSubmit={handleCreateProject}>
              <div>
                <label>Project Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label>Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Create Project</button>
            </form>
          </section>
        )}

        <section className="card">
          <h2>Projects</h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="empty">No projects yet. {isAdmin ? 'Create one above.' : ''}</p>
          ) : (
            <ul className="project-list">
              {projects.map(p => (
                <li key={p._id}>
                  <Link to={`/projects/${p._id}`} className="project-link">
                    <strong>{p.name}</strong>
                    <span className="project-desc">{p.description || 'No description'}</span>
                    <span className="project-meta">
                      Status: {p.status} | Tasks: {taskCount(p._id)} | Owner: {p.owner?.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
