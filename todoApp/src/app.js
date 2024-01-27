import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config({
  path: "./.env",
});
import express from "express";

export const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.CORS_ORIGIN.includes(origin)) {
        console.log(origin);
        console.log(process.env.CORS_ORIGIN);
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import todoRouter from "./routes/todo.routes.js";
//routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/todos", todoRouter);
