import express from "express";
import { signup, login, logout, updateUserProfile, changePassword, getMe} from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// ✅ New route to update student profile
// router.put("/update-profile", protect, updateStudentProfile);
router.put("/update-profile", protect, upload.single("profilepic"), updateUserProfile);

router.post("/change-password", protect, changePassword);

export default router;
