import { APIResponseHandler } from "../utils/APIResponseHandler.js";
import { APIErrorHandler } from "../utils/APIErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new APIErrorHandler(500, "Something went wrong", [error]);
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new APIErrorHandler(400, "All fields are required");
  }
  const isUserAvailable = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (isUserAvailable) {
    throw new APIErrorHandler(409, "User already exists");
  }
  const user = await User.create({
    username: username.trim().toLowerCase(),
    password,
    email: email.trim().toLowerCase(),
  });
  console.log(user);
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new APIErrorHandler(500, "Unable to create the user");
  }
  res
    .status(201)
    .json(
      new APIResponseHandler(201, createdUser, "User created successfully")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  if (!username && !email) {
    throw new APIErrorHandler(
      400,
      "Either of username or password is required"
    );
  }
  if (!password) {
    throw new APIErrorHandler(400, "Password is required");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new APIErrorHandler(404, "User not found");
  }
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new APIErrorHandler(401, "Incorrect Password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new APIErrorHandler(500, "Unable to login the user");
  }
  console.log(loggedInUser);
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new APIResponseHandler(200, loggedInUser, "User logged in successfully")
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const { user } = req;
  console.log(user);
  if (!user) {
    throw APIErrorHandler(400, "Not logged in");
  }
  await User.findByIdAndUpdate(user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
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

export const getUserInfo = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new APIErrorHandler(400, "Not logged in");
  }
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new APIErrorHandler(500, "Unable to fetch user info");
  }

  res
    .status(200)
    .json(
      new APIResponseHandler(
        200,
        loggedInUser,
        "User info fetched successfully"
      )
    );
});
