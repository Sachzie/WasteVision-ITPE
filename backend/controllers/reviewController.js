const Review = require("../models/review")

// Create a new review (user)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" })
    }

    const review = await Review.create({
      user: req.user.id,
      rating,
      comment,
      status: "pending",
    })

    return res.status(201).json({ success: true, review })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Get current user's reviews
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()
    return res.status(200).json({ success: true, reviews })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Admin: get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate({ path: "user", select: "name email" })
      .sort({ createdAt: -1 })
      .lean()
    return res.status(200).json({ success: true, reviews })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Admin: update review status (approve/reject)
exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" })
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" })
    }

    return res.status(200).json({ success: true, review })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}