import { Router } from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {togglePostLike,toggleCommentLike} from "../controllers/like.controller.js"
const router = Router();
router.use(verifyJWT); 

router.route("/toggle/p/:postId").get(togglePostLike);
router.route("/toggle/c/:commentId").get(toggleCommentLike);
// router.route("/get-like-post").get(getLikedPost);
// router.route("/toggle/t/:tweetId").get(toggleTweetLike);

export default router