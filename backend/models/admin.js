const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")

const adminSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "name field is required"],
  },
  email: {
    type: String,
    required: [true, "email field is required"],
    unique: true,
    validate: [validator.isEmail, "invalid email"],
  },
  password: {
    type: String,
    required: [true, "password field is required"],
  },
  avatar: {
    public_id: { type: String },
    url: { type: String },
  },
  role: {
    type: String,
    enum: ["admin"],
    default: "admin",
  },
}, {
  timestamps: true,
})

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

module.exports = mongoose.model("Admin", adminSchema)