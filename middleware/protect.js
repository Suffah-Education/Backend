import jwt from "jsonwebtoken";
import Student from "../models/user.model.js";
import Teacher from "../models/teacher.model.js";
import Admin from "../models/admin.model.js";

export const protect = async (req, res, next) => {
  try {
    // 1️⃣ Cookie ya header se token lena
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // 2️⃣ Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Token ke andar se userID nikalna
    let user =
      (await Student.findById(decoded.userID).select("-password")) ||
      (await Teacher.findById(decoded.userID).select("-password")) ||
      (await Admin.findById(decoded.userID).select("-password"));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4️⃣ req.user me user attach kar dena
    req.user = user;

    next(); // ✅ next middleware ya controller ko allow karo
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
