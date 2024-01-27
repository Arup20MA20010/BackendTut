import jwt from "jsonwebtoken";
import { APIErrorHandler } from "../utils/APIErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const { accessToken } =
    req?.cookies || req?.headers("Authorization").replace("Bearer ", "");
  if (!accessToken) {
    throw new APIErrorHandler(401, "Unauthorized");
  }
  const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  const loggedInUser = await User.findById(decodedToken?.id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new APIErrorHandler(400, "Invalid Token");
  }
  req.user = loggedInUser;
  next();
});
