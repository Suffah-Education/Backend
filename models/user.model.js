import mongoose from "mongoose";


const studentSchema = new mongoose.Schema({
    name:{
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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
    },
      enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
}, {timestamps: true});

const Student = mongoose.model("Student", studentSchema);
export default Student;