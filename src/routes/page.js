const express = require('express');
const router = express.Router();
const PagesController = require('../controllers/pages');

router.get('/', PagesController.getAllPage);
router.post('/', PagesController.createPage);
router.get('/:id', PagesController.getPageById);
router.post('/:id', PagesController.removePage);
router.put('/:id', PagesController.updatePage);
module.exports = router;