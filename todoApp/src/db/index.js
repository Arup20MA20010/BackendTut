import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${process.env.DB_NAME}`
    );
    console.log(
      `MongoDB connected on port ${process.env.PORT}: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(error);
  }
};
