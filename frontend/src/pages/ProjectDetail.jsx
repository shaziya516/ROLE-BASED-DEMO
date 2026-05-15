import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const [editDue, setEditDue] = useState('');
  const [editAssign, setEditAssign] = useState('');

  const isAdmin = user?.role === 'admin';

  const load = () => {
    setLoading(true);
    const reqs = [
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`)
    ];
    if (isAdmin) reqs.push(api.get('/auth/users'));

    Promise.all(reqs)
      .then(([p, t, u]) => {
        setProject(p.data.project);
        setTasks(t.data.tasks);
        if (u) setUsers(u.data.users);
      })
      .catch(() => setError('Could not load project'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
  }, [id, user?.role]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api.post(`/tasks/project/${id}`, {
        title, description, dueDate: dueDate || null, assignedTo: assignedTo || null
      });
      setTasks([r.data.task, ...tasks]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedTo('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
    }
  };

  const startEdit = (task) => {
    setEditId(task._id);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditStatus(task.status);
    setEditDue(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setEditAssign(task.assignedTo?._id || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const r = await api.put(`/tasks/${editId}`, {
        title: editTitle,
        description: editDesc,
        status: editStatus,
        dueDate: editDue || null,
        assignedTo: editAssign || null
      });
      setTasks(tasks.map(t => t._id === editId ? r.data.task : t));
      setEditId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const progress = tasks.length
    ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
    : 0;

  return (
    <>
      <header className="header">
        <h1>Team Task Manager</h1>
        <div className="header-right">
          <span>{user.name}</span>
          <span className={`role-tag ${user.role}`}>{user.role}</span>
          <button className="btn btn-small" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      <main className="main">
        <p className="back-link"><Link to="/">Back to Dashboard</Link></p>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p className="loading">Loading...</p>
        ) : !project ? (
          <p className="empty">Project not found</p>
        ) : (
          <>
            <section className="card">
              <h2>{project.name}</h2>
              <p>{project.description || 'No description'}</p>
              <p className="task-meta">Status: {project.status} | Owner: {project.owner?.name}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="task-meta">Progress: {progress}% done ({tasks.filter(t => t.status === 'done').length}/{tasks.length} tasks)</p>
            </section>

            {isAdmin && (
              <section className="card">
                <h2>Add Task</h2>
                <form onSubmit={handleCreateTask}>
                  <div>
                    <label>Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label>Description</label>
                    <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div>
                      <label>Due Date</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label>Assign To</label>
                      <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">Add Task</button>
                </form>
              </section>
            )}

            <section className="card">
              <h2>Tasks</h2>
              {tasks.length === 0 ? (
                <p className="empty">No tasks in this project.</p>
              ) : (
                tasks.map(task => (
                  <article key={task._id} className={`task-item ${isOverdue(task) ? 'overdue' : ''}`}>
                    {editId === task._id ? (
                      <form className="edit-form" onSubmit={handleUpdate}>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                        <textarea rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        <div className="form-row">
                          <div>
                            <label>Status</label>
                            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="done">Done</option>
                            </select>
                          </div>
                          <div>
                            <label>Due Date</label>
                            <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label>Assign To</label>
                          <select value={editAssign} onChange={e => setEditAssign(e.target.value)}>
                            <option value="">Unassigned</option>
                            {users.map(u => (
                              <option key={u._id} value={u._id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="task-actions">
                          <button type="submit" className="btn btn-primary btn-small">Save</button>
                          <button type="button" className="btn btn-small" onClick={() => setEditId(null)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3>{task.title}</h3>
                        {task.description && <p className="desc">{task.description}</p>}
                        <p className="task-meta">
                          <span className={`status-badge status-${task.status}`}>{statusLabel(task.status)}</span>
                          {' | Assigned: '}{task.assignedTo?.name || 'Nobody'}
                          {task.dueDate && (
                            <>
                              {' | Due: '}{new Date(task.dueDate).toLocaleDateString()}
                              {isOverdue(task) && <span className="overdue-text"> (Overdue)</span>}
                            </>
                          )}
                        </p>
                        {isAdmin && (
                          <div className="task-actions">
                            <button className="btn btn-small" onClick={() => startEdit(task)}>Edit</button>
                            <button className="btn btn-danger btn-small" onClick={() => handleDelete(task._id)}>Delete</button>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
