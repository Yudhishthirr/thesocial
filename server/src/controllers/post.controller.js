import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { Hashtags } from "../models/hashtage.model.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const postCreation = async (req, res, next) => {
  try {
    let { title, hashtags } = req.body;
    const userId = req.user?._id;
    console.log(title);

    if (!title) {
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
    console.error("Post creation error:", error);
    throw new ApiError(400, "Something went wrong while creating the post");
  }
};


// const getPosts = async (req, res) => {
//   try {
//     const posts = await Post.aggregate([
//       // Sort newest first
//       { $sort: { createdAt: -1 } },

//       // 1️⃣ Join User
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "user"
//         }
//       },
//       { $unwind: "$user" },

//       // 2️⃣ Join Likes (get all likes for each post)
//       {
//         $lookup: {
//           from: "likes",
//           localField: "_id",
//           foreignField: "post",
//           as: "likes"
//         }
//       },

//       // 3️⃣ Join Comments
//       {
//         $lookup: {
//           from: "comments",
//           localField: "_id",
//           foreignField: "post",
//           as: "comments"
//         }
//       },

//       // 4️⃣ Add likeCount & commentCount
//       {
//         $addFields: {
//           likeCount: { $size: "$likes" },
//           commentCount: { $size: "$comments" }
//         }
//       },

//       // 5️⃣ Clean output
//       {
//         $project: {
//           title: 1,
//           postUrl: 1,
//           createdAt: 1,

//           likeCount: 1,
//           commentCount: 1,

//           user: {
//             _id: "$user._id",
//             username: "$user.username",
//             fullName: "$user.fullName",
//             avatar: "$user.avatar"
//           }
//         }
//       }
//     ]);

//     return res
//       .status(200)
//       .json(new ApiResponse(200, posts, "Posts fetched successfully"));

//   } catch (error) {
//     return res
//       .status(error.statusCode || 500)
//       .json(new ApiResponse(500, null, error.message));
//   }
// };

const getPosts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;   // <--- from query
    const limit = 5;                            // posts per page
    const skip = (page - 1) * limit;

    // 1️⃣ Count all posts
    const totalPosts = await Post.countDocuments();

    // 2️⃣ Aggregation with pagination
    const posts = await Post.aggregate([
      { $sort: { createdAt: -1 } },

      // Pagination added
      { $skip: skip },
      { $limit: limit },

      // Join user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // Join likes
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },

      // Join comments
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "post",
          as: "comments",
        },
      },

      // Counts
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          commentCount: { $size: "$comments" },
        },
      },

      // Output clean
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
            avatar: "$user.avatar",
          },
        },
      },
    ]);

    // 3️⃣ Pagination Response
    res.status(200).json({
      posts,
      nextPage: page + 1,
      hasMore: skip + posts.length < totalPosts,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
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
