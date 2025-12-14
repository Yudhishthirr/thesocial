import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkBlock } from "../middlewares/checkBlock.middleware.js";
import {toggleFollow,getFollowRequest,acceptedFollowRequest} from "../controllers/followers.controller.js"


const router = Router();



// router.route("/follow").post(verifyJWT,toggleFollow) //follwo some one
router.route("/follow/:followingId").post(verifyJWT,checkBlock,toggleFollow) //follwo some one


router.route("/get-follow-request").get(verifyJWT,getFollowRequest) //unfollwo some one
router.route("/accept-follow-request/:id").get(verifyJWT,acceptedFollowRequest) //unfollwo some one

export default router