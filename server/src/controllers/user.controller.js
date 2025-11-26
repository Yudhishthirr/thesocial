
import express from "express"
import bodyParser from "body-parser"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const app = express()

app.use(bodyParser.json())

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    // 1️⃣ Validate input fields
    if ([fullName, email, username, password].some((item) => !item?.trim())) {
      throw new ApiError(400, "All fields are required");
    }

    // 2️⃣ Check existing user
    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }

    // 3️⃣ Validate avatar file
    const file = req.files?.AvtarImage?.[0];
    if (!file) {
      throw new ApiError(400, "Avatar image is required");
    }

    // 4️⃣ Upload avatar to Cloudinary
    const uploadedAvatar = await uploadOnCloudinary(file.path);

    if (!uploadedAvatar?.secure_url) {
      throw new ApiError(500, "Avatar upload failed");
    }

    const avatarUrl = uploadedAvatar.secure_url;

    // 5️⃣ Create user
    const user = await User.create({
      fullName,
      email,
      username: username.toLowerCase(),
      password,
      avatar: avatarUrl,
    });

    // 6️⃣ Remove password + refreshToken before sending response
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating the user");
    }

    // 7️⃣ Final response
    return res
      .status(201)
      .json(
        new ApiResponse(201, createdUser, "User registered successfully")
      );

  } catch (error) {
    console.error("Register Error:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          null,
          error.message || "Internal server error"
        )
      );
  }
};


const loginUser = async (req, res) =>{
   

    const {email, username, password} = req.body
    console.log(req.body)
    console.log(email);

  
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
        
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "Invalid credentials")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
}

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"))

}


const logoutUser = async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged Out"))
}

const changeCurrentPassword = async(req,res)=>{
   
    const {oldPassword,newPassword}= req.body
  
    console.log(oldPassword)
    console.log(newPassword)
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
}

const getCurrentUser = async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
}


const getUserInfo = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    const userInfo = await User.aggregate([
      {
        $match: { _id: objectId }
      },

      // JOIN Follow collection
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "user",
          as: "followData"
        }
      },

      { 
        $unwind: { 
          path: "$followData",
          preserveNullAndEmptyArrays: true
        }
      },

      // JOIN Posts collection
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "posts"
        }
      },

      // Add computed fields
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ["$followData.followers", []] } },
          followingCount: { $size: { $ifNull: ["$followData.following", []] } },
          postsCount: { $size: "$posts" }
        }
      },

      // Final response formatting
      {
        $project: {
          username: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          followersCount: 1,
          followingCount: 1,
          postsCount: 1,
          posts: {
            title: 1,
            postUrl: 1,
            createdAt: 1
          }
        }
      }
    ]);

    if (!userInfo || userInfo.length === 0) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          userInfo[0],
          "User info fetched successfully"
        )
      );

  } catch (error) {
    console.error("❌ getUserInfo Error:", error);

    return res
      .status(error.statusCode || 500)
      .json(
        new ApiResponse(
          error.statusCode || 500,
          {},
          error.message || "Internal server error"
        )
      );
  }
};
export {registerUser,loginUser,logoutUser,changeCurrentPassword,getCurrentUser,getUserInfo}