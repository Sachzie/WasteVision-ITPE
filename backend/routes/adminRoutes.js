const express = require("express")
const router = express.Router()

const { verifyToken, requireAdmin } = require("../middlewares/auth")
const adminController = require("../controllers/adminController")
const reviewController = require("../controllers/reviewController")

// Admin-only routes
router.get("/users", verifyToken, requireAdmin, adminController.getAllUsers)
router.get("/activities", verifyToken, requireAdmin, adminController.getAllActivities)
router.get("/users/:id/activities", verifyToken, requireAdmin, adminController.getActivitiesByUser)

// Reviews (Admin)
router.get('/reviews', verifyToken, requireAdmin, reviewController.getAllReviews)
router.put('/reviews/:id/status', verifyToken, requireAdmin, reviewController.updateReviewStatus)

module.exports = router