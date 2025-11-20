import express from "express";
import {
  getPendingTeachers,
  getApprovedTeachers,
  approveTeacher,
  rejectTeacher,
} from "../controllers/admin.controller.js";

const router = express.Router();

// 🟠 Pending teachers
router.get("/pending-teachers", getPendingTeachers);

// 🟢 Approved teachers
router.get("/", getApprovedTeachers);

// ✅ Approve teacher
router.patch("/approve-teacher/:id", approveTeacher);

// ❌ Reject teacher
router.delete("/reject-teacher/:id", rejectTeacher);

export default router;
