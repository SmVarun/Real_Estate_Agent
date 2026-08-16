import app from "./app.js"
import credential from "./config/config.js"
import  connectDatabase from "./config/mongodb.js"


const port = credential.port || 8000
const startServer = async ()=>{
    await  connectDatabase();
    app.listen(port,()=>{
           console.log(`server is working on the port : ${port}`)
    })
}

startServer()
