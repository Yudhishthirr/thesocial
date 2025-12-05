import { Router } from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {togglePostLike,toggleCommentLike} from "../controllers/like.controller.js"
const router = Router();
router.use(verifyJWT); 

router.route("/toggle/p/:postId").get(verifyJWT,togglePostLike);
router.route("/toggle/c/:commentId").get(verifyJWT,toggleCommentLike);
// router.route("/get-like-post").get(getLikedPost);
// router.route("/toggle/t/:tweetId").get(toggleTweetLike);

export default router