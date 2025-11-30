import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkBlock } from "../middlewares/checkBlock.middleware.js";
import {toggleFollow} from "../controllers/followers.controller.js"


const router = Router();



// router.route("/follow").post(verifyJWT,toggleFollow) //follwo some one
router.route("/follow").post(verifyJWT,checkBlock,toggleFollow) //follwo some one

export default router