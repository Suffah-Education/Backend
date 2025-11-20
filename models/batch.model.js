// import mongoose from 'mongoose';

// const batchSchema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         code: {
//             type: String,
//             required: true,
//             unique: true,
//             trim: true,
//         },
//         startDate: {
//             type: Date,
//             required: true,
//         },
//         capacity: {
//             type: Number,
//             required: true,
//             min: 1,
//             default: 25,
//         },
//         // IMPORTANT: Link to the Teacher model
//         teacher: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Teacher', // Assumes your Teacher model is named 'Teacher'
//             required: true,
//         },
//         // You might add fields like status (active/archived), course reference, etc.
//     },
//     {
//         timestamps: true,
//     }
// );

// const Batch = mongoose.model('Batch', batchSchema);

// export default Batch;



import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});


const classSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const batchSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true },

        startDate: { type: Date, required: true },
        endDate: { type: Date },

        capacity: { type: Number, required: true, default: 25 },

        description: { type: String, default: "" },
        duration: { type: String, default: "" },
        price: { type: Number, required: true, default: 0 },

        syllabus: [{ type: String }],

        // NEW: Classes
        classes: [classSchema],

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },

        students: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Student" }
        ],

        messages: [messageSchema],

        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active"
        }
    },
    { timestamps: true }
);

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;

