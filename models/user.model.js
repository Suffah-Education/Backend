import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    dob: Date,
    address: String,
    class: { type: String, default: "" },
    password: { type: String, required: true },
    profilepic: { type: String, default: "" },
    city: { type: String, default: "" },
    role: { type: String, default: "student" },

    securityQuestion: { type: String, required: true },
    securityAnswerHash: { type: String, required: true },

    enrolledBatches: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Batch" }
    ],
  },
  { timestamps: true }
);

studentSchema.index({ _id: 1, enrolledBatches: 1 });

const Student = mongoose.model("Student", studentSchema);
export default Student;
