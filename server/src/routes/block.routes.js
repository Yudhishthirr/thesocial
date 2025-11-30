
import { Router } from 'express';
import {blockUser} from '../controllers/block.controller.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); 


router.route("/blockUser/:blocked").get(verifyJWT,blockUser);

export default router
