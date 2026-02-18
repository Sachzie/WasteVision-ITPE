const express = require("express")
const router = express.Router()

const { upload } = require("../configs/cloudinary"); // Import the upload middleware

const {verifyToken} = require("../middlewares/auth")
const userActivityController = require("../controllers/userController")
const reviewController = require("../controllers/reviewController")

router.post("/save-record", verifyToken, upload.single("image"), userActivityController.saveRecord)
router.get('/user-records', verifyToken, userActivityController.fetchRecords);
router.get('/user-records/:id', verifyToken, userActivityController.fetchRecordById);
router.delete('/user-records/:id', verifyToken, userActivityController.deleteRecord);
router.get('/statistics', verifyToken, userActivityController.getUserStatistics);

// Reviews (User)
router.post('/reviews', verifyToken, reviewController.createReview)
router.get('/reviews', verifyToken, reviewController.getMyReviews)

module.exports = router