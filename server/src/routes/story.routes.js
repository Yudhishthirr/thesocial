import { Router } from "express";
import {postCreation,viewStoy,reactStory,addCommentStory,deleteStory} from "../controllers/story.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/add-story").post(verifyJWT,postCreation);
router.route("/view-story/:storyId").get(verifyJWT,viewStoy);
router.route("/react-story/:storyId").post(verifyJWT,reactStory);
router.route("/comment-story/:storyId").post(verifyJWT,addCommentStory);
router.route("/delete-story/:storyId").get(verifyJWT,deleteStory);


export default router