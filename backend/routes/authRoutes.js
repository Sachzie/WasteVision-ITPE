const express = require("express");
const router = express.Router();


const authController = require("../controllers/authController");
const { upload } = require("../configs/cloudinary"); // Import the upload middleware
const {verifyToken} = require("../middlewares/auth")

// Apply multer middleware to the register route for a single file upload with the field name 'avatar'
router.post("/register", upload.single("avatar"), authController.register);
router.post("/login", authController.login);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, upload.single("avatar"), authController.updateProfile);
router.get('/verify-email', authController.verifyEmail);

module.exports = router;