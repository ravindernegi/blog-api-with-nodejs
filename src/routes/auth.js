const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');

router.get('/', AuthController.getAuthUser);
router.post('/login', AuthController.login);
router.post('/forgotpassword', AuthController.forgotpassword);
router.get('/logout', AuthController.logout);
router.get('/refresh-token', AuthController.refreshToken);
router.post('/update-profile', AuthController.updateProfile);
router.post('/change-password', AuthController.changePassword);
module.exports = router;