require("dotenv").config()
const app = require("./app")
const connectToDatabase = require("./configs/database")
connectToDatabase()

const PORT = process.env.PORT || 4000;

app.listen(PORT,()=>{
    console.log(`server is running in port ${PORT}`)
})
