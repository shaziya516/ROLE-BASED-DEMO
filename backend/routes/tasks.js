const express = require('express');
const router = express.Router();
const {
  getTasks, getMyTasks, getProjectTasks, createTask, updateTask, deleteTask
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/my', getMyTasks);
router.get('/', getTasks);
router.get('/project/:projectId', getProjectTasks);
router.post('/project/:projectId', adminOnly, createTask);
router.put('/:id', adminOnly, updateTask);
router.delete('/:id', adminOnly, deleteTask);

module.exports = router;
