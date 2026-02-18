const User = require("../models/user")
const UserActivity = require("../models/userActivity")

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("name email role avatar createdAt updatedAt").lean()
    return res.status(200).json({ success: true, users })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Get all activities across all users
exports.getAllActivities = async (req, res) => {
  try {
    const activities = await UserActivity.find({})
      .populate({ path: "user", select: "name email role" })
      .sort({ createdAt: -1 })
      .lean()

    return res.status(200).json({ success: true, activities })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}

// Get activities by user id
exports.getActivitiesByUser = async (req, res) => {
  try {
    const { id } = req.params
    const activities = await UserActivity.find({ user: id })
      .populate({ path: "user", select: "name email role" })
      .sort({ createdAt: -1 })
      .lean()
    return res.status(200).json({ success: true, activities })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message })
  }
}