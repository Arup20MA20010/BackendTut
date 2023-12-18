import { User } from "../models/user.model.js";
import APIErrorHandler from "../utils/APIErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken =
      req?.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
    if (!accessToken) throw new APIErrorHandler(401, "Unauthorized request");

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new APIErrorHandler(401, "Invalid token");
    req.user = user;
    next();
  } catch (error) {
    throw new APIErrorHandler(401, "Invalid tokens");
  }
});
