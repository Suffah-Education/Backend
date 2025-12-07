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
        // Additional profile fields
        email: {
            type: String,
        },
        city: {
            type: String,
        },
        address: {
            type: String,
        },
        dob: {
            type: Date,
        },
        qualification: {
            type: String,
        },
        bio: {
            type: String,
        },
        experience: {
            type: Number,
        },
        education: {
            type: String,
        },
        profilepic: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        securityQuestion: { type: String, required: true },
        securityAnswerHash: { type: String, required: true },
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

// teacher.model.js  (optimized)
// teacherSchema.index({ phone: 1 });
teacherSchema.index({ email: 1 });


export const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
