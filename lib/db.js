import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        // Check if MONGO_URL is defined
        if (!process.env.MONGO_URL) {
            throw new Error("MONGO_URL environment variable is not defined");
        }

        // Connect with connection pooling
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            maxPoolSize: 50,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,

        });


    } catch (error) {
        console.error("❌ Error in MongoDB connection:", error.message);
        process.exit(1); // Exit process with failure
    }
}