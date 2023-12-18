import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.static("public"));

//Routes
import userRoutes from "./routes/user.routes.js";

app.use("/api/v1/users", userRoutes); // userRoutes used as a middleware
//transfers the controll of the route to the userRoutes where the required route is searched

export { app };
