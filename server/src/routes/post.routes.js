import { Router } from "express";
import {postCreation, getPosts,getPostById,deletePostById} from "../controllers/post.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()


router.route("/create").post(
  verifyJWT,
  upload.fields([{ name: "postImage", maxCount: 1 }]),
  postCreation
);

router.route("/get-posts").get(verifyJWT,getPosts);
router.route("/get-post/:id").get(getPostById);
router.route("/delete-post/:id").get(deletePostById);

export default router