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
      const { name, phone, dob, address, password, securityQuestion, securityAnswer } = req.body;

      if (!name || !phone || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ message: "Please fill all required fields" });
      }

      const existingStudent = await Student.findOne({ phone });
      if (existingStudent) {
        return res.status(400).json({ message: "Student already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const securityAnswerHash = securityAnswer
        ? await bcrypt.hash(securityAnswer, 10)
        : undefined;

      const newStudent = await Student.create({
        name,
        phone,
        dob,
        address,
        password: hashedPassword,
        securityQuestion,
        securityAnswerHash,
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
      const {
        name,
        phone,
        email,
        education,
        photo,
        password,
        city,
        address,
        dob,
        qualification,
        bio,
        experience,
        securityQuestion,
        securityAnswer,
      } = req.body;

      if (!name || !phone || !password) {
        return res.status(400).json({ message: "Please fill all required fields" });
      }

      const existingTeacher = await Teacher.findOne({ phone });
      if (existingTeacher) {
        return res.status(400).json({ message: "Teacher already exists" });
      }

      // Hash password and create teacher
      const hashedPassword = await bcrypt.hash(password, 10);
      const securityAnswerHash = securityAnswer
        ? await bcrypt.hash(securityAnswer, 10)
        : undefined;

      const newTeacher = await Teacher.create({
        name,
        phone,
        email,
        education,
        profilepic: photo,
        city,
        address,
        dob,
        qualification,
        bio,
        experience,
        password: hashedPassword,
        securityQuestion,
        securityAnswerHash,
      });

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

    // 👇 NEW: Create a user object without the password
    const userToReturn = user.toObject({ getters: true });
    delete userToReturn.password;

    res.status(200).json({
      message: `${role} login successful`,
      token,
      role: user.role,
      // 👇 NEW: Return the full, password-less user object
      user: userToReturn,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};


// Forgot password - get security question
export const getSecurityQuestion = async (req, res) => {
  try {
    const { role, phone } = req.body;

    if (!role || !phone) {
      return res.status(400).json({ message: "Role and phone are required" });
    }

    // Normalize phone (strip non-digits)
    const cleanPhone = String(phone).replace(/\D/g, "").trim();
    // console.log("🔍 Searching for:", { role, inputPhone: phone, cleanPhone });

    let user = null;
    const Model = role === "student" ? Student : role === "teacher" ? Teacher : null;

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Try multiple lookup strategies
    // Strategy 1: Exact match with normalized phone
    user = await Model.findOne({ phone: cleanPhone });

    // Strategy 2: Exact match with original phone
    if (!user) {
      user = await Model.findOne({ phone: phone });
    }

    // Strategy 3: Regex match (contains cleanPhone)
    if (!user) {
      user = await Model.findOne({ phone: { $regex: cleanPhone } });
    }

    // Strategy 4: Find ALL users and log for debugging
    if (!user) {
      const allUsers = await Model.find({}).select("name phone securityQuestion");
      // console.log(`📱 All ${role}s in DB:`, allUsers.map(u => ({ name: u.name, phone: u.phone })));
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check security question exists
    if (!user.securityQuestion || user.securityQuestion.trim() === "") {
      console.warn(`⚠️ User found but NO security question set. User:`, user.name, user.phone);
      return res.status(404).json({ message: "Recovery question not set for this user. Please contact support." });
    }
    res.json({ question: user.securityQuestion });
  } catch (err) {
    console.error("❌ getSecurityQuestion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const resetPasswordWithSecurityAnswer = async (req, res) => {
  try {
    const { role, phone, securityAnswer, newPassword } = req.body;

    if (!role || !phone || !securityAnswer || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // normalize phone
    const cleanPhone = String(phone).replace(/\D/g, "").trim();
    // console.log("🔑 Resetting password for:", { role, inputPhone: phone, cleanPhone });

    let user = null;
    const Model = role === "student" ? Student : role === "teacher" ? Teacher : null;

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Try multiple lookup strategies
    user = await Model.findOne({ phone: cleanPhone });
    if (!user) user = await Model.findOne({ phone: phone });
    if (!user) user = await Model.findOne({ phone: { $regex: cleanPhone } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if security answer hash exists
    if (!user.securityAnswerHash || user.securityAnswerHash.trim() === "") {
      console.warn(`⚠️ User found but NO security answer stored. User:`, user.name);
      return res.status(404).json({ message: "Recovery not set for this user." });
    }

    // Verify answer
    const isCorrect = await bcrypt.compare(securityAnswer, user.securityAnswerHash);
    if (!isCorrect) {
      console.warn(`❌ Wrong answer for user:`, user.name);
      return res.status(401).json({ message: "Wrong answer" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    // console.log(`✅ Password reset for:`, user.name);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ resetPasswordWithSecurityAnswer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const verifySecurityAnswer = async (req, res) => {
  try {
    const { role, phone, securityAnswer } = req.body;

    if (!role || !phone || !securityAnswer) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanPhone = String(phone).replace(/\D/g, "").trim();
    // console.log("🔍 Verifying answer for:", { role, inputPhone: phone, cleanPhone });

    let user = null;
    const Model = role === "student" ? Student : role === "teacher" ? Teacher : null;

    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Try multiple lookup strategies
    user = await Model.findOne({ phone: cleanPhone });
    if (!user) user = await Model.findOne({ phone: phone });
    if (!user) user = await Model.findOne({ phone: { $regex: cleanPhone } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if security answer hash exists
    if (!user.securityAnswerHash || user.securityAnswerHash.trim() === "") {
      console.warn(`⚠️ User found but NO security answer stored. User:`, user.name, user.phone);
      return res.status(404).json({ message: "Recovery not set for this user." });
    }

    // Compare answer
    const isCorrect = await bcrypt.compare(securityAnswer, user.securityAnswerHash);
    if (!isCorrect) {
      console.warn(`❌ Wrong answer for user:`, user.name);
      return res.status(401).json({ message: "Wrong answer" });
    }

    // console.log(`✅ Answer verified for:`, user.name);
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ verifySecurityAnswer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};




export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};



export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Frontend se aaye fields
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

    // 🌟 NEW: Cloudinary image URL
    let uploadedImage = null;
    if (req.file) {
      uploadedImage = req.file.path; // CloudinaryStorage gives secure_url in path
    }

    // ===========================
    // 1️⃣ STUDENT UPDATE
    // ===========================
    let user = await Student.findById(userId);
    if (user) {
      user.name = name ?? user.name;
      user.city = city ?? user.city;
      user.phone = phone ?? user.phone;
      user.address = address ?? user.address;
      user.dob = dob ?? user.dob;

      // 🌟 Profile pic priority:
      // 1) Cloudinary upload
      // 2) OR existing frontend value
      user.profilepic = uploadedImage || profilepic || user.profilepic;

      const updated = await user.save();
      return res.json({
        success: true,
        message: "Profile updated successfully",
        user: updated.toObject({ getters: true, virtuals: false }),
      });
    }

    // ===========================
    // 2️⃣ TEACHER UPDATE
    // ===========================
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
      user.education = education ?? user.education;
      user.email = email ?? user.email;

      // 🌟 Teacher ka profile image → "photo"
      user.profilepic = uploadedImage || profilepic || user.profilepic;

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

