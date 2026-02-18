const jwt = require("jsonwebtoken")
const User = require("../models/user")
const Admin = require("../models/admin")

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json("Unauthorized Access")
  const auth = req.headers.authorization
  const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : ""
  if (!token) return res.status(500).json("missing token")

  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
  req.user = payload

  next()
}

// Require admin role
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const role = req.user?.role
    if (!userId) return res.status(401).json("Unauthorized Access")

    // Prefer checking Admin collection for existence
    if (role === 'admin') {
      const admin = await Admin.findById(userId).select("_id role")
      if (!admin) {
        return res.status(403).json("Forbidden: Admin access required")
      }
      return next()
    }

    // Not admin token
    return res.status(403).json("Forbidden: Admin access required")
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message })
  }
}

module.exports = { verifyToken, requireAdmin }