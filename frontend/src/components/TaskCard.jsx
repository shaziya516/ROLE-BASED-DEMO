import { FiAlertCircle, FiClock, FiFlag, FiUser } from 'react-icons/fi';
import { format, isAfter, parseISO } from 'date-fns';

const STATUS_CONFIG = {
  'todo':        { label: 'To Do',       color: '#94a3b8' },
  'in-progress': { label: 'In Progress', color: '#f59e0b' },
  'review':      { label: 'Review',      color: '#8b5cf6' },
  'done':        { label: 'Done',        color: '#10b981' },
};
const PRIORITY_CONFIG = {
  'low':      { label: 'Low',      color: '#10b981' },
  'medium':   { label: 'Medium',   color: '#f59e0b' },
  'high':     { label: 'High',     color: '#ef4444' },
  'critical': { label: 'Critical', color: '#dc2626' },
};

export default function TaskCard({ task, onClick, onStatusChange }) {
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG['todo'];
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['medium'];
  const isOverdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''}`} onClick={onClick}>
      <div className="task-card-header">
        <span className="task-priority-dot" style={{ background: priority.color }} />
        <span className="task-priority-label" style={{ color: priority.color }}>
          <FiFlag size={11} /> {priority.label}
        </span>
        {isOverdue && <span className="overdue-badge"><FiAlertCircle size={11} /> Overdue</span>}
      </div>

      <h4 className="task-title">{task.title}</h4>

      {task.description && (
        <p className="task-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</p>
      )}

      {task.project && (
        <div className="task-project-tag" style={{ borderColor: task.project.color || '#6366f1' }}>
          <span style={{ background: task.project.color || '#6366f1' }} className="project-dot" />
          {task.project.name}
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-meta">
          {task.dueDate && (
            <span className={`task-due ${isOverdue ? 'text-red' : ''}`}>
              <FiClock size={12} />
              {format(new Date(task.dueDate), 'MMM dd')}
            </span>
          )}
          {task.assignedTo && (
            <span className="task-assignee">
              <FiUser size={12} />
              {task.assignedTo.name.split(' ')[0]}
            </span>
          )}
        </div>
        <select
          className="status-select"
          value={task.status}
          style={{ color: status.color, borderColor: status.color + '44' }}
          onClick={e => e.stopPropagation()}
          onChange={e => onStatusChange && onStatusChange(task._id, e.target.value)}
        >
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
