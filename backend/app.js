const express = require("express")
const app = express()
const cors = require("cors")
const path =  require("path")

app.use(cors())
app.use(express.json()) 

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const adminRoutes = require("./routes/adminRoutes")

// Mount routes AFTER body parsers are configured.
app.use("/api/auth",authRoutes)
app.use("/api/user",userRoutes)
app.use("/api/admin", adminRoutes)


// app.use(express.static(path.join(__dirname, "../ml_service")));
module.exports = app