import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Student from "../models/user.model.js";
import Teacher from "../models/teacher.model.js";
import Admin from "../models/admin.model.js"; // optional future admin
import { generateToken } from "../lib/utils.js";



// 🧱 SIGNUP CONTROLLER
export const signup = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }

        // ========== STUDENT SIGNUP ==========
        if (role === "student") {
            const { name, phone, dob, address, password } = req.body;

            if (!name || !phone || !password) {
                return res.status(400).json({ message: "Please fill all required fields" });
            }

            const existingStudent = await Student.findOne({ phone });
            if (existingStudent) {
                return res.status(400).json({ message: "Student already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newStudent = await Student.create({
                name,
                phone,
                dob,
                address,
                password: hashedPassword,
            });

            // const token = generateToken(newStudent);
            const token = generateToken(newStudent._id, res);

            return res.status(201).json({
                message: "Student signup successful",
                token,
                role: newStudent.role,
                user: {
                    id: newStudent._id,
                    name: newStudent.name,
                    phone: newStudent.phone,
                },
            });
        }

        // ========== TEACHER SIGNUP ==========
        else if (role === "teacher") {
            const { name, phone, email, education, photo, password } = req.body;

            if (!name || !phone || !password) {
                return res.status(400).json({ message: "Please fill all required fields" });
            }

            const existingTeacher = await Teacher.findOne({ phone });
            if (existingTeacher) {
                return res.status(400).json({ message: "Teacher already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newTeacher = await Teacher.create({
                name,
                phone,
                email,
                education,
                photo,
                password: hashedPassword,
            });

            // const token = generateToken(newTeacher);
            const token = generateToken(newTeacher._id, res);


            return res.status(201).json({
                message: "Teacher signup successful (pending admin approval)",
                token,
                role: newTeacher.role,
                user: {
                    id: newTeacher._id,
                    name: newTeacher.name,
                    phone: newTeacher.phone,
                    approvedByAdmin: newTeacher.approvedByAdmin,
                },
            });
        }

        // ========== ADMIN SIGNUP (optional future use) ==========
        else if (role === "admin") {
            const { name, adminId, password } = req.body;

            if (!name || !adminId || !password) {
                return res.status(400).json({ message: "All admin fields required" });
            }

            const existingAdmin = await Admin.findOne({ adminId });
            if (existingAdmin) {
                return res.status(400).json({ message: "Admin already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newAdmin = await Admin.create({
                name,
                adminId,
                password: hashedPassword,
            });

            // const token = generateToken(newAdmin);
            const token = generateToken(newAdmin._id, res);



            return res.status(201).json({
                message: "Admin created successfully",
                token,
                role: newAdmin.role,
                user: {
                    id: newAdmin._id,
                    name: newAdmin.name,
                    adminId: newAdmin.adminId,
                },
            });
        }

        // ========== INVALID ROLE ==========
        else {
            return res.status(400).json({ message: "Invalid role type" });
        }
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ message: "Server error during signup" });
    }
};




// 🔐 LOGIN CONTROLLER
export const login = async (req, res) => {
  try {
    const { role, phone, password, adminId } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    let user;

    // ========== STUDENT LOGIN ==========
    if (role === "student") {
      user = await Student.findOne({ phone });
      if (!user) {
        return res.status(404).json({ message: "Student not found" });
      }
    }

    // ========== TEACHER LOGIN ==========
    else if (role === "teacher") {
      user = await Teacher.findOne({ phone });
      if (!user) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Optional: only allow login if approved
       if (!user.approvedByAdmin) {
        return res.status(403).json({
          message: "Your account is under review. Please wait for admin approval.",
          underReview: true,
        });
      }
    }

    // ========== ADMIN LOGIN ==========
    else if (role === "admin") {
      user = await Admin.findOne({ adminId });
      if (!user) {
        return res.status(404).json({ message: "Admin not found" });
      }
    }

    // ========== INVALID ROLE ==========
    else {
      return res.status(400).json({ message: "Invalid role" });
    }



    // ===== PASSWORD CHECK =====
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }


    // ===== TOKEN GENERATION =====
    const token = generateToken(user._id, res);

    res.status(200).json({
      message: `${role} login successful`,
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone || user.adminId,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};
    


export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};


// ✨ UPDATE STUDENT PROFILE
// export const updateStudentProfile = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // extract fields from frontend
//     const { name, city, class: classLevel, profilepic, phone, address, dob } = req.body;

//     const updatedStudent = await Student.findByIdAndUpdate(
//       userId,
//       {
//         name,
//         city,
//         class: classLevel,
//         profilepic,
//         phone,
//         address,
//         dob,
//       },
//       { new: true }
//     ).select("-password");

//     if (!updatedStudent) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     res.json({
//       success: true,
//       message: "Profile updated successfully",
//       user: updatedStudent,
//     });
//   } catch (error) {
//     console.error("Profile update error:", error);
//     res.status(500).json({ message: "Server error during profile update" });
//   }
// };

// ✨ UPDATE USER PROFILE (Student + Teacher)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Frontend se jo fields aaye wo le lo
    const {
      name,
      city,
      phone,
      address,
      dob,
      qualification,
      bio,
      experience,
      profilepic,
      education,
      email,
    } = req.body;

    // Step 1 — Check if Student
    let user = await Student.findById(userId);
    if (user) {
      user.name = name ?? user.name;
      user.city = city ?? user.city;
      user.phone = phone ?? user.phone;
      user.address = address ?? user.address;
      user.dob = dob ?? user.dob;
      user.profilepic = profilepic ?? user.profilepic;

      const updated = await user.save();
      return res.json({
        success: true,
        message: "Profile updated successfully",
        user: updated.toObject({ getters: true, virtuals: false }),
      });
    }

    // Step 2 — Check if Teacher
    user = await Teacher.findById(userId);
    if (user) {
      user.name = name ?? user.name;
      user.phone = phone ?? user.phone;
      user.city = city ?? user.city;
      user.address = address ?? user.address;
      user.dob = dob ?? user.dob;
      user.experience = experience ?? user.experience;
      user.bio = bio ?? user.bio;
      user.qualification = qualification ?? user.qualification;
      user.photo = profilepic ?? user.photo;
      user.email = email ?? user.email;
      user.education = education ?? user.education;

      const updated = await user.save();
      return res.json({
        success: true,
        message: "Profile updated successfully",
        user: updated.toObject({ getters: true, virtuals: false }),
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};



// ✨ CHANGE PASSWORD CONTROLLER
export const changePassword = async (req, res) => {
  try {
    const userID = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both fields are required" });
    }

    // Find user in all collections
    let user =
      (await Student.findById(userID)) ||
      (await Teacher.findById(userID)) ||
      (await Admin.findById(userID));

    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      return res.status(401).json({ message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.log("Change Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// 👤 GET ME - Fetch current user profile with populated relations
export const getMe = async (req, res) => {
  try {
    const userID = req.user._id;

    let user = await Student.findById(userID)
      .select("-password")
      .populate("enrolledBatches", "name code teacher price startDate capacity");

    if (!user) {
      user = await Teacher.findById(userID).select("-password");
    }

    if (!user) {
      user = await Admin.findById(userID).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Get Me Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

