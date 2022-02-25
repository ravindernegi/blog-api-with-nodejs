const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts');

router.get('/', PostsController.getAllPost);
router.post('/', PostsController.createPost);
router.get('/:id', PostsController.getPostById);
router.post('/:id', PostsController.removePost);
router.put('/:id', PostsController.updatePost);
module.exports = router;
