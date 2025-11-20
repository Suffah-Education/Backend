import mongoose from "mongoose";


const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  dob: {
    type: Date,
  },
  address: {
    type: String,
  },
  class: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
  profilepic: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "student",
  },
  enrolledBatches: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Batch" }
  ]
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);
export default Student;