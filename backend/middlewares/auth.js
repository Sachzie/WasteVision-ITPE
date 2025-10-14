const jwt = require("jsonwebtoken")

const verifyToken = (req,res,next)=>{
    if(!req.headers.Authorization)  return res.status(401).json("Unauthorized Access")
    const auth = req.headers.Authorization
    const token = auth.startsWith("Bearer ") ? auth.slice(" ")[0]: "";
    if(!token) return res.status(500).json("missing token")
    const payload = jwt.verify(token,process.env.JWT_SECRET, {algorithms:['HS256']})

    if(!isMatch) return res.status(500).json("Invalid token")
    req.user =  payload

    next()
}

module.exports = {verifyToken}