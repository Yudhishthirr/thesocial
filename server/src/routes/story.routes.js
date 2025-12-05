import { Router } from "express";
import {addStory,viewStory,reactStory,addCommentStory,deleteStory,getFollowingStories} from "../controllers/story.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkBlock } from "../middlewares/checkBlock.middleware.js";
const router = Router()



router.route("/add-story").post(verifyJWT,
    verifyJWT,
    upload.fields([{ name: "MediaFile", maxCount: 1 }]),
    addStory
);

router.route("/view-story/:storyId").get(verifyJWT,checkBlock,viewStory);
router.route("/react-story/:storyId").post(verifyJWT,reactStory);
router.route("/comment-story/:storyId").post(verifyJWT,checkBlock,addCommentStory);
router.route("/delete-story/:storyId").delete(verifyJWT,deleteStory);

router.route("/get-stories").get(verifyJWT,getFollowingStories);




export default router