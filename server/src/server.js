import dotenv from "dotenv"
import connectDB from "./db/dbconfig.js";
import {app} from './app.js'
import { createServer } from "http";
import { initSocket } from "./utils/socket/socket.js";

dotenv.config({
    path: './.env'
})

const server = createServer(app);



connectDB()
.then(() => {

    initSocket(server);

    server.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})