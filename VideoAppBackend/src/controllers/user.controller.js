import { User } from "../models/user.model.js";
import APIErrorHandler from "../utils/APIErrorHandler.js";
import APIResponseHandler from "../utils/APIResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary } from "../utils/fileUploader.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userID) => {
  //This function generates access and refresh tokens,save the refresh token
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIErrorHandler(
      500,
      "Unable to generate access and refresh tokens"
    );
  }
};

export const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, fullName } = req.body;
  if (
    [username, email, password, fullName].some((item) => item.trim() === "")
  ) {
    throw new APIErrorHandler(400, "Please fill all the fields");
  }

  const ifUserExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (ifUserExist) {
    throw new APIErrorHandler(
      409,
      "User with either the same username or the same email already exists"
    );
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  // const coverImageLocalFilePath = req.files?.cover[0]?.path;
  let coverImageLocalFilePath = "";
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0 &&
    req.files.coverImage[0].path
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
    console.log(coverImageLocalFilePath);
  }

  if (!avatarLocalFilePath) {
    throw new APIErrorHandler(400, "Please upload an avatar");
  }

  const avatarUrl = await uploadFileToCloudinary(avatarLocalFilePath);
  const coverUrl = await uploadFileToCloudinary(coverImageLocalFilePath);
  console.log(coverUrl);

  if (!avatarUrl) {
    throw new APIErrorHandler(500, "Unable to upload avatar");
  }

  const user = await User.create({
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password,
    fullName,
    avatar: avatarUrl.url,
    coverImage: coverUrl?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new APIErrorHandler(500, "Something went wrong in registration");
  }

  res
    .status(201)
    .json(
      new APIResponseHandler(201, createdUser, "User registered successfully")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  console.log(email, password, username);
  if (!email && !username) {
    throw new APIErrorHandler(400, "Please provide either email or username");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new APIErrorHandler(404, "User not found");
  }
  console.log(password);
  console.log(user);
  const isPasswordCorrect = await user.validatePassword(password);
  console.log("After check");
  if (!isPasswordCorrect) {
    throw new APIErrorHandler(401, "Incorrect password");
  }
  console.log(user);
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new APIResponseHandler(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new APIResponseHandler(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new APIErrorHandler(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new APIErrorHandler(401, "Invalid refresh token");
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new APIErrorHandler(401, "Given token has expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    console.log(newRefreshToken);
    res
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new APIResponseHandler(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new APIErrorHandler(401, error?.message || "Invalid refresh token");
  }
});
