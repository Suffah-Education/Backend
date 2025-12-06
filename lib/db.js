import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        // Check if MONGO_URL is defined
        if (!process.env.MONGO_URL) {
            throw new Error("MONGO_URL environment variable is not defined");
        }

        // Connect with connection pooling
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            maxPoolSize: 10,
        });

        // Properly log connection details
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database Name: ${conn.connection.name}`);
        console.log(`✅ MongoDB connected with connection pooling`);

        // Handle index creation
        mongoose.connection.once("open", async () => {
            console.log("⚙️ Database connected, indexes already auto-created by Mongoose");
            console.log("✅ Ready to handle requests!");
        });

    } catch (error) {
        console.error("❌ Error in MongoDB connection:", error.message);
        process.exit(1); // Exit process with failure
    }
}