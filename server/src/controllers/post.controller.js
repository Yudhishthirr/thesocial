import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { Hashtags } from "../models/hashtage.model.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const postCreation = async (req, res, next) => {
//   try {
//     let { title, postUrl, hashtags } = req.body;
//     const userId = req.user?._id;

//     // parse hashtags if they come as a string (common with multipart/form-data)
//     let parsedHashtags = hashtags;
//     if (typeof hashtags === "string") {
//       // try JSON parse first (client may send '["a","b"]'), otherwise treat comma-separated
//       try {
//         parsedHashtags = JSON.parse(hashtags);
//       } catch (_) {
//         parsedHashtags = hashtags
//           .split(",")
//           .map((t) => t.trim())
//           .filter(Boolean);
//       }
//     }

//     // Validate basic inputs
//     if (typeof title !== "string" || title.trim() === "") {
//       throw new ApiError(400, "Title is required and must be a non-empty string");
//     }
//     if (typeof postUrl !== "string" || postUrl.trim() === "") {
//       throw new ApiError(400, "Post URL is required and must be a non-empty string");
//     }
//     if (!Array.isArray(parsedHashtags) || parsedHashtags.length === 0) {
//       throw new ApiError(400, "At least one hashtag is required");
//     }
//     if (!userId) {
//       throw new ApiError(401, "User not found");
//     }
//     if (parsedHashtags.some((t) => typeof t !== "string" || t.trim() === "")) {
//       throw new ApiError(400, "Invalid hashtag format");
//     }

//     // Handle file upload (if present)
//     let imageUrl = null;
//     try {
//       const files = req.files || {};
//       if (files.postImage && files.postImage[0]) {
//         const localPath = files.postImage[0].path; // multer path
//         const uploadResult = await uploadOnCloudinary(localPath);
//         imageUrl = uploadResult?.secure_url || uploadResult?.url || null;
//       }
//     } catch (err) {
//       // If the upload failed, bubble up a clear error (cloudinary cleanup is done in uploadOnCloudinary)
//       console.error("Cloudinary upload error:", err);
//       throw new ApiError(500, "Failed to upload image");
//     }

//     // Step 1: Create post (include imageUrl if present)
//     const post = await Post.create({
//       title: title.toLowerCase(),
//       postUrl: postUrl.toLowerCase().trim(),
//       userId: userId,
//       imageUrl, // optional field on your schema; ensure Post schema supports this
//     });

//     if (!post) throw new ApiError(500, "Failed to create post");

//     // Step 2: Create hashtags document linked to post
//     const hashtagsDoc = await Hashtags.create({
//       hashtags: parsedHashtags.map((tag) => tag.toLowerCase().trim()),
//       postId: post._id,
//     });

//     return res
//       .status(201)
//       .json(new ApiResponse(201, "Post and Hashtags created successfully", { post, hashtagsDoc }));
//   } catch (error) {
//     // forward to express error handler middleware (or return ApiError)
//     next(error);
//   }
// };
const postCreation = async (req, res, next) => {
  try {
    let { title, hashtags } = req.body;
    const userId = req.user?._id;

    if (!title || typeof title !== "string") {
      throw new ApiError(400, "Title is required");
    }

    
    if (typeof hashtags === "string") {
      try {
        hashtags = JSON.parse(hashtags);
      } catch {
        hashtags = hashtags.split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      throw new ApiError(400, "At least one hashtag is required");
    }

  
    let postUrl = null;
    const file = req.files?.postImage?.[0];

    if (file) {
      const uploaded = await uploadOnCloudinary(file.path);
      postUrl = uploaded.secure_url;  // <<< SAVE THIS IN DB
    } else {
      throw new ApiError(400, "Post image is required");
    }

    // Create Post
    const post = await Post.create({
      title: title.toLowerCase(),
      postUrl,   // CLOUDINARY URL SAVED HERE
      userId
    });

    // Create Hashtags
    const hashtagsDoc = await Hashtags.create({
      hashtags: hashtags.map(h => h.toLowerCase()),
      postId: post._id
    });

    return res.status(201).json(
      new ApiResponse(201, "Post created successfully", { post, hashtagsDoc })
    );

  } catch (error) {
    next(error);
  }
};

// const getPosts = async (req, res) => {
//   const posts = await Post.find().sort({ createdAt: -1 }).lean();

//   if (!Array.isArray(posts) || posts.length === 0) {
//     return res.status(200).json(new ApiResponse(200, [], "No posts found"));
//   }

//   return res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully"));
// };

const getPosts = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      // Sort newest first
      { $sort: { createdAt: -1 } },

      // 1️⃣ Join User
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // 2️⃣ Join Likes (get all likes for each post)
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes"
        }
      },

      // 3️⃣ Join Comments
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments"
        }
      },

      // 4️⃣ Add likeCount & commentCount
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          commentCount: { $size: "$comments" }
        }
      },

      // 5️⃣ Clean output
      {
        $project: {
          title: 1,
          postUrl: 1,
          createdAt: 1,

          likeCount: 1,
          commentCount: 1,

          user: {
            _id: "$user._id",
            username: "$user.username",
            fullName: "$user.fullName",
            avatar: "$user.avatar"
          }
        }
      }
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, posts, "Posts fetched successfully"));

  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiResponse(500, null, error.message));
  }
};

const getPostById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Post ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID");
  }

  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res.status(200).json(new ApiResponse(200, "Post fetched successfully", post));
};

const deletePostById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Post ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID");
  }
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  await Hashtags.findOneAndDelete({ postId: id });
  await Post.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, "Post deleted successfully", { id }));
};
export { postCreation, getPosts, getPostById, deletePostById };
