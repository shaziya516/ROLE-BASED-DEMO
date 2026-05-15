const Task = require('../models/Task');
const Project = require('../models/Project');

const populateTask = (q) => q
  .populate('createdBy', 'name email')
  .populate('assignedTo', 'name email')
  .populate('project', 'name');

async function canAccessProject(user, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return { ok: false, status: 404, message: 'Project not found' };
  return { ok: true, project };
}

exports.getTasks = async (req, res) => {
  try {
    const tasks = await populateTask(Task.find().sort({ createdAt: -1 }));
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await populateTask(
      Task.find({ assignedTo: req.user._id }).sort({ dueDate: 1, createdAt: -1 })
    );
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const access = await canAccessProject(req.user, req.params.projectId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const tasks = await populateTask(
      Task.find({ project: req.params.projectId }).sort({ createdAt: -1 })
    );
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, assignedTo } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ message: 'Title is required' });

    const access = await canAccessProject(req.user, req.params.projectId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      status: ['todo', 'in-progress', 'done'].includes(status) ? status : 'todo',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      project: req.params.projectId,
      createdBy: req.user._id
    });
    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await canAccessProject(req.user, task.project);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const { title, description, status, dueDate, assignedTo } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (['todo', 'in-progress', 'done'].includes(status)) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

    await task.save();
    const populated = await populateTask(Task.findById(task._id));
    res.json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await canAccessProject(req.user, task.project);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
