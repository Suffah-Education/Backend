import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Student from "../models/user.model.js";
import Teacher from "../models/teacher.model.js";
import Admin from "../models/admin.model.js"; // optional future admin


// 🧩 Helper Function
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};


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

            const token = generateToken(newStudent);

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

            const token = generateToken(newTeacher);

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

            const token = generateToken(newAdmin);

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
          message: "Your account is not approved by admin yet",
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
    const token = generateToken(user);

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
    
