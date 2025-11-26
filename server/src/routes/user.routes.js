import { Router } from "express";
import {registerUser,loginUser,logoutUser,changeCurrentPassword,getCurrentUser,getUserInfo} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()
router.route("/register").post(
  upload.fields([{ name: "AvtarImage", maxCount: 1 }]),
  registerUser
);
// router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT,logoutUser);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/get-user-info").get(verifyJWT,getUserInfo);

export default router