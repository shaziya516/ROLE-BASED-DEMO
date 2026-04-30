import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import {
  FiCheckSquare, FiClock, FiAlertTriangle, FiTrendingUp,
  FiFolder, FiActivity, FiPlus
} from 'react-icons/fi';

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div className="stat-icon" style={{ background: color + '22', color }}>{icon}</div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/stats'),
      api.get('/projects')
    ]).then(([statsRes, projRes]) => {
      setStats(statsRes.data.stats);
      setRecentTasks(statsRes.data.recentTasks);
      setProjects(projRes.data.projects.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      const res = await api.get('/tasks/stats');
      setStats(res.data.stats);
      setRecentTasks(res.data.recentTasks);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content center"><div className="spinner large" /></main>
    </div>
  );

  const completion = stats?.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Here's what's happening with your projects today</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/projects')}>
            <FiPlus /> New Project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard icon={<FiActivity />}  label="Total Tasks"   value={stats?.total || 0}      color="#6366f1" />
          <StatCard icon={<FiClock />}     label="In Progress"   value={stats?.inProgress || 0}  color="#f59e0b" />
          <StatCard icon={<FiCheckSquare />} label="Completed"   value={stats?.done || 0}        color="#10b981" />
          <StatCard icon={<FiAlertTriangle />} label="Overdue"   value={stats?.overdue || 0}     color="#ef4444"
            sub={stats?.overdue > 0 ? 'Needs attention' : 'All good!'} />
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label"><FiTrendingUp /> Overall Completion</span>
            <span className="progress-pct">{completion}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${completion}%` }} />
          </div>
          <div className="progress-breakdown">
            <span>📋 Todo: {stats?.todo}</span>
            <span>⚡ In Progress: {stats?.inProgress}</span>
            <span>🔍 Review: {stats?.review}</span>
            <span>✅ Done: {stats?.done}</span>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Recent Tasks */}
          <section className="dash-section">
            <div className="section-header">
              <h2 className="section-title"><FiCheckSquare /> Recent Tasks</h2>
              <button className="btn-ghost" onClick={() => navigate('/tasks')}>View all</button>
            </div>
            <div className="task-list">
              {recentTasks.length === 0
                ? <div className="empty-state small">No tasks yet</div>
                : recentTasks.map(t => (
                  <TaskCard key={t._id} task={t}
                    onClick={() => navigate('/tasks')}
                    onStatusChange={handleStatusChange} />
                ))}
            </div>
          </section>

          {/* Active Projects */}
          <section className="dash-section">
            <div className="section-header">
              <h2 className="section-title"><FiFolder /> Active Projects</h2>
              <button className="btn-ghost" onClick={() => navigate('/projects')}>View all</button>
            </div>
            <div className="project-mini-list">
              {projects.length === 0
                ? <div className="empty-state small">No projects yet</div>
                : projects.map(p => (
                  <div key={p._id} className="project-mini-card"
                    onClick={() => navigate(`/projects/${p._id}`)}>
                    <div className="project-mini-color" style={{ background: p.color || '#6366f1' }} />
                    <div className="project-mini-info">
                      <span className="project-mini-name">{p.name}</span>
                      <span className={`project-status-badge ${p.status}`}>{p.status}</span>
                    </div>
                    <span className="project-mini-members">{p.members.length + 1} members</span>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
