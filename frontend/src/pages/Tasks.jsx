import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import { FiCheckSquare, FiFilter, FiSearch } from 'react-icons/fi';

const STATUS_OPTS = ['todo','in-progress','review','done'];
const PRIORITY_OPTS = ['low','medium','high','critical'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    api.get('/tasks/my').then(r => setTasks(r.data.tasks)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    const r = await api.put(`/tasks/${taskId}`, { status });
    setTasks(prev => prev.map(t => t._id === taskId ? r.data.task : t));
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchPriority = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const now = new Date();
  const overdue = filtered.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now);
  const active = filtered.filter(t => !overdue.includes(t) && t.status !== 'done');
  const done = filtered.filter(t => t.status === 'done');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">{user.role === 'admin' ? 'All Tasks' : 'My Tasks'}</h1>
            <p className="page-subtitle">{filtered.length} tasks found</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-row gap-8">
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priority</option>
              {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {(filterStatus || filterPriority || search) && (
              <button className="btn-ghost" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? <div className="center"><div className="spinner large" /></div> : (
          <div className="tasks-page-content">
            {overdue.length > 0 && (
              <section className="task-section">
                <h2 className="task-section-title overdue-title">⚠ Overdue ({overdue.length})</h2>
                <div className="task-list">
                  {overdue.map(t => <TaskCard key={t._id} task={t} onStatusChange={handleStatusChange} />)}
                </div>
              </section>
            )}
            {active.length > 0 && (
              <section className="task-section">
                <h2 className="task-section-title">Active Tasks ({active.length})</h2>
                <div className="task-list">
                  {active.map(t => <TaskCard key={t._id} task={t} onStatusChange={handleStatusChange} />)}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section className="task-section">
                <h2 className="task-section-title done-title">✓ Completed ({done.length})</h2>
                <div className="task-list">
                  {done.map(t => <TaskCard key={t._id} task={t} onStatusChange={handleStatusChange} />)}
                </div>
              </section>
            )}
            {filtered.length === 0 && (
              <div className="empty-state">
                <FiCheckSquare size={48} />
                <h3>No tasks found</h3>
                <p>Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
