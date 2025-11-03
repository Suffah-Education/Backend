import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            default: "teacher",
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
        },
        education: {
            type: String,
        },
        photo: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        coursesCreated: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
        approvedByAdmin: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
