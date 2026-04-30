import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import {
  FiArrowLeft, FiPlus, FiUsers, FiTrash2, FiX,
  FiUserPlus, FiCalendar, FiCheck
} from 'react-icons/fi';
import { format } from 'date-fns';

const STATUS_OPTS = ['todo','in-progress','review','done'];
const PRIORITY_OPTS = ['low','medium','high','critical'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title:'', description:'', status:'todo', priority:'medium', assignedTo:'', dueDate:'', tags:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const canManage = project && (user.role === 'admin' || project.owner?._id === user._id);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
      api.get('/auth/users')
    ]).then(([pRes, tRes, uRes]) => {
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
      setAllUsers(uRes.data.users);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchTasks = () =>
    api.get(`/tasks/project/${id}${filterStatus ? `?status=${filterStatus}` : ''}`)
      .then(r => setTasks(r.data.tasks));

  useEffect(() => { fetchTasks(); }, [filterStatus]);

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title:'', description:'', status:'todo', priority:'medium', assignedTo:'', dueDate:'', tags:'' });
    setError(''); setShowTaskModal(true);
  };
  const openEditTask = (t) => {
    setEditTask(t);
    setTaskForm({
      title: t.title, description: t.description, status: t.status, priority: t.priority,
      assignedTo: t.assignedTo?._id || '', dueDate: t.dueDate ? t.dueDate.slice(0,10) : '',
      tags: t.tags?.join(', ') || ''
    });
    setError(''); setShowTaskModal(true);
  };

  const handleSaveTask = async e => {
    e.preventDefault();
    if (!taskForm.title.trim()) return setError('Title required');
    setSaving(true); setError('');
    const payload = { ...taskForm, tags: taskForm.tags ? taskForm.tags.split(',').map(t=>t.trim()) : [] };
    try {
      if (editTask) {
        const r = await api.put(`/tasks/${editTask._id}`, payload);
        setTasks(prev => prev.map(t => t._id === editTask._id ? r.data.task : t));
      } else {
        const r = await api.post(`/tasks/project/${id}`, payload);
        setTasks(prev => [r.data.task, ...prev]);
      }
      setShowTaskModal(false);
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const handleStatusChange = async (taskId, status) => {
    const r = await api.put(`/tasks/${taskId}`, { status });
    setTasks(prev => prev.map(t => t._id === taskId ? r.data.task : t));
  };

  const handleAddMember = async (userId) => {
    try {
      const r = await api.post(`/projects/${id}/members`, { userId, role: 'member' });
      setProject(r.data.project);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const r = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(r.data.project);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return (
    <div className="app-layout"><Sidebar />
      <main className="main-content center"><div className="spinner large" /></main>
    </div>
  );

  const memberIds = project.members.map(m => m.user?._id);
  const nonMembers = allUsers.filter(u => !memberIds.includes(u._id) && u._id !== project.owner?._id);

  const grouped = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'review': tasks.filter(t => t.status === 'review'),
    'done': tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="flex-row gap-12">
            <button className="btn-ghost icon-only" onClick={() => navigate('/projects')}><FiArrowLeft /></button>
            <div>
              <div className="flex-row gap-8 align-center">
                <div className="project-dot-lg" style={{ background: project.color }} />
                <h1 className="page-title">{project.name}</h1>
                <span className={`badge status-${project.status}`}>{project.status}</span>
              </div>
              {project.description && <p className="page-subtitle">{project.description}</p>}
            </div>
          </div>
          <div className="flex-row gap-8">
            {canManage && (
              <button className="btn-secondary" onClick={() => setShowMemberModal(true)}>
                <FiUserPlus /> Members ({project.members.length + 1})
              </button>
            )}
            <button className="btn-primary" onClick={openCreateTask}><FiPlus /> Add Task</button>
          </div>
        </div>

        {/* Meta row */}
        <div className="project-meta-row">
          <span className={`priority-badge prio-${project.priority}`}>{project.priority}</span>
          {project.deadline && (
            <span className="meta-item"><FiCalendar size={13} /> Due {format(new Date(project.deadline),'MMM dd, yyyy')}</span>
          )}
          <span className="meta-item"><FiUsers size={13} /> {project.members.length + 1} members</span>
        </div>

        {/* Filter */}
        <div className="filter-row">
          <span className="filter-label">Filter:</span>
          {['', ...STATUS_OPTS].map(s => (
            <button key={s} className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}>
              {s || 'All'} {s && <span className="filter-count">{grouped[s]?.length || 0}</span>}
            </button>
          ))}
        </div>

        {/* Kanban Board */}
        {filterStatus ? (
          <div className="task-list padded">
            {tasks.length === 0
              ? <div className="empty-state small">No tasks with this status</div>
              : tasks.map(t => (
                <TaskCard key={t._id} task={t}
                  onClick={() => openEditTask(t)}
                  onStatusChange={handleStatusChange} />
              ))}
          </div>
        ) : (
          <div className="kanban-board">
            {Object.entries(grouped).map(([col, colTasks]) => (
              <div key={col} className="kanban-column">
                <div className="kanban-col-header">
                  <span className={`kanban-col-dot col-${col}`} />
                  <span className="kanban-col-title">{col.replace('-',' ')}</span>
                  <span className="kanban-count">{colTasks.length}</span>
                </div>
                <div className="kanban-cards">
                  {colTasks.map(t => (
                    <TaskCard key={t._id} task={t}
                      onClick={() => openEditTask(t)}
                      onStatusChange={handleStatusChange} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="kanban-empty">No tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTask ? 'Edit Task' : 'New Task'}</h2>
              <div className="flex-row gap-8">
                {editTask && canManage && (
                  <button className="icon-btn danger" onClick={() => { handleDeleteTask(editTask._id); setShowTaskModal(false); }}>
                    <FiTrash2 />
                  </button>
                )}
                <button className="icon-btn" onClick={() => setShowTaskModal(false)}><FiX /></button>
              </div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} placeholder="Task title" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})} rows={3} placeholder="Details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e=>setTaskForm({...taskForm,status:e.target.value})}>
                    {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}>
                    {PRIORITY_OPTS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={taskForm.assignedTo} onChange={e=>setTaskForm({...taskForm,assignedTo:e.target.value})}>
                    <option value="">Unassigned</option>
                    {[project.owner, ...project.members.map(m=>m.user)].filter(Boolean).map(u=>(
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm({...taskForm,dueDate:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input value={taskForm.tags} onChange={e=>setTaskForm({...taskForm,tags:e.target.value})} placeholder="design, frontend, bug" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={()=>setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner"/> : editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiUsers /> Team Members</h2>
              <button className="icon-btn" onClick={() => setShowMemberModal(false)}><FiX /></button>
            </div>
            <div className="member-list">
              <div className="member-item owner">
                <div className="member-avatar">{project.owner?.name?.[0]?.toUpperCase()}</div>
                <div className="member-info">
                  <span className="member-name">{project.owner?.name}</span>
                  <span className="member-email">{project.owner?.email}</span>
                </div>
                <span className="badge status-active">Owner</span>
              </div>
              {project.members.map(m => m.user && (
                <div key={m.user._id} className="member-item">
                  <div className="member-avatar">{m.user.name?.[0]?.toUpperCase()}</div>
                  <div className="member-info">
                    <span className="member-name">{m.user.name}</span>
                    <span className="member-email">{m.user.email}</span>
                  </div>
                  {canManage && (
                    <button className="icon-btn danger" onClick={() => handleRemoveMember(m.user._id)}>
                      <FiX />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canManage && nonMembers.length > 0 && (
              <div className="add-member-section">
                <h4>Add Members</h4>
                <div className="add-member-list">
                  {nonMembers.map(u => (
                    <div key={u._id} className="member-item">
                      <div className="member-avatar">{u.name?.[0]?.toUpperCase()}</div>
                      <div className="member-info">
                        <span className="member-name">{u.name}</span>
                        <span className="member-email">{u.email}</span>
                      </div>
                      <button className="icon-btn success" onClick={() => handleAddMember(u._id)}>
                        <FiCheck />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
