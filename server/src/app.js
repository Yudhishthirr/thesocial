import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import { globalErrorHandler } from "./middlewares/error.middleware.js"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from './routes/user.routes.js'
import postRouter from './routes/post.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import followRouter from './routes/followers.routes.js'
import storyRouter from './routes/story.routes.js'
import blockRouter from './routes/block.routes.js'


app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/story", storyRouter);

app.use("/api/v1/block", blockRouter);


app.use(globalErrorHandler);

export { app }