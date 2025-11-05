
import { Router } from 'express';
import {addComment,deleteComment,updateComment,getComments} from '../controllers/comment.controller.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); 


router.route("/add-comment/:postId").post(addComment)
router.route("/update-comment/:commentId").patch(updateComment)
router.route("/delete-comment/:commentId").get(deleteComment)
router.route("/get-comment/:id").get(getComments)


export default router
