const Project = require('../models/Project');
const Task = require('../models/Task');

// Create project (admin only)
exports.createProject = async (req, res) => {
  try {
    const { name, description, status, priority, deadline, color, members } = req.body;
    const project = await Project.create({
      name, description, status, priority, deadline, color,
      owner: req.user._id,
      members: members || []
    });
    await project.populate('owner', 'name email role');
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all projects for user
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('owner', 'name email')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update project (admin or owner)
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const canEdit = project.owner.equals(req.user._id) || req.user.role === 'admin';
    if (!canEdit) return res.status(403).json({ message: 'Access denied' });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');
    res.json({ project: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete project (admin only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const canDelete = project.owner.equals(req.user._id) || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ message: 'Access denied' });

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const canEdit = project.owner.equals(req.user._id) || req.user.role === 'admin';
    if (!canEdit) return res.status(403).json({ message: 'Access denied' });

    const alreadyMember = project.members.some(m => m.user.equals(userId));
    if (alreadyMember) return res.status(400).json({ message: 'User already a member' });

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email role');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const canEdit = project.owner.equals(req.user._id) || req.user.role === 'admin';
    if (!canEdit) return res.status(403).json({ message: 'Access denied' });

    project.members = project.members.filter(m => !m.user.equals(req.params.userId));
    await project.save();
    res.json({ message: 'Member removed', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
