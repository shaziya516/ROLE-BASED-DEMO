import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
  FiPlus, FiFolder, FiUsers, FiCalendar, FiTrash2,
  FiEdit2, FiX, FiCheck
} from 'react-icons/fi';
import { format } from 'date-fns';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#14b8a6'];
const STATUS_OPTS = ['planning','active','on-hold','completed'];
const PRIORITY_OPTS = ['low','medium','high','critical'];

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', status:'planning', priority:'medium', deadline:'', color: COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  };
  useEffect(fetchProjects, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name:'', description:'', status:'planning', priority:'medium', deadline:'', color: COLORS[0] });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p, e) => {
    e.stopPropagation();
    setEditProject(p);
    setForm({ name: p.name, description: p.description, status: p.status, priority: p.priority,
      deadline: p.deadline ? p.deadline.slice(0,10) : '', color: p.color || COLORS[0] });
    setError('');
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setSaving(true); setError('');
    try {
      if (editProject) {
        const r = await api.put(`/projects/${editProject._id}`, form);
        setProjects(prev => prev.map(p => p._id === editProject._id ? r.data.project : p));
      } else {
        const r = await api.post('/projects', form);
        setProjects(prev => [r.data.project, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (p, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${p.name}"? All tasks will be removed.`)) return;
    try {
      await api.delete(`/projects/${p._id}`);
      setProjects(prev => prev.filter(x => x._id !== p._id));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <FiPlus /> New Project
          </button>
        </div>

        {loading ? <div className="center"><div className="spinner large" /></div> :
          projects.length === 0 ? (
            <div className="empty-state">
              <FiFolder size={48} />
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
              <button className="btn-primary" onClick={openCreate}><FiPlus /> Create Project</button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(p => (
                <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
                  <div className="project-card-top" style={{ background: `linear-gradient(135deg, ${p.color}33, ${p.color}11)` }}>
                    <div className="project-color-bar" style={{ background: p.color }} />
                    <div className="project-card-actions">
                      {(user.role === 'admin' || p.owner?._id === user._id) && (
                        <>
                          <button className="icon-action" onClick={e => openEdit(p, e)} title="Edit"><FiEdit2 /></button>
                          <button className="icon-action danger" onClick={e => handleDelete(p, e)} title="Delete"><FiTrash2 /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="project-card-body">
                    <div className="project-card-header">
                      <h3 className="project-name">{p.name}</h3>
                      <span className={`badge status-${p.status}`}>{p.status}</span>
                    </div>
                    {p.description && <p className="project-desc">{p.description.slice(0,100)}{p.description.length>100?'…':''}</p>}
                    <div className="project-card-meta">
                      <span className={`priority-badge prio-${p.priority}`}>{p.priority}</span>
                      <span className="meta-item"><FiUsers size={13} /> {p.members.length + 1}</span>
                      {p.deadline && <span className="meta-item"><FiCalendar size={13} /> {format(new Date(p.deadline),'MMM dd')}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProject ? 'Edit Project' : 'New Project'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Project Name *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Website Redesign" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Brief project description..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                    {PRIORITY_OPTS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(c=>(
                    <button key={c} type="button" className={`color-swatch ${form.color===c?'selected':''}`}
                      style={{background:c}} onClick={()=>setForm({...form,color:c})}>
                      {form.color===c && <FiCheck size={12} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner"/> : editProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
