const mongoose =require("mongoose")

const connectToDatabase = () =>{
    mongoose.connect(process.env.DB_URI).then(con=>{
        console.log(`connected to mongoDB with host ${con.connection.host}`)
    })
}

module.exports = connectToDatabase