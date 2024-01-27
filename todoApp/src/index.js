import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error: Unable to connect the server to database", error);
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is connected to the database`);
    });
  })
  .catch((err) => console.log(err));
