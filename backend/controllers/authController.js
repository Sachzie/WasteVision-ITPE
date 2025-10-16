const User =require("../models/user")
const bcrypt = require("bcrypt")
exports.login= async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error.message)
        return res.status(500). json(error.message)
    }
}

exports.register =async(req,res)=>{
    try {
        
        const newUser =await User.create(req.body)
        await newUser.save()
        return res.status(200).json(newUser)
    } catch (error) {
        console.log(error.message)
        return res.status(500). json(error.message)
    }
}