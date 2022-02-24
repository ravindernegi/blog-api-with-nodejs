const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/users');

router.get('/', UsersController.getAllUser);
router.post('/', UsersController.createUser);
router.get('/:id', UsersController.getUserById);
router.post('/delete', UsersController.removeUser);
router.put('/:id', UsersController.updateUser);
module.exports = router;