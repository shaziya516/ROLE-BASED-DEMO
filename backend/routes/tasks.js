const express = require('express');
const router = express.Router();
const {
  createTask, getProjectTasks, getMyTasks,
  getTask, updateTask, deleteTask, getDashboardStats
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/my', getMyTasks);
router.get('/stats', getDashboardStats);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/project/:projectId', createTask);
router.get('/project/:projectId', getProjectTasks);

module.exports = router;
