import express from "express";
import {
  getPendingTeachers,
  getApprovedTeachers,
  approveTeacher,
  rejectTeacher,
  getSingleTeacher,
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

// 🔍 Single teacher full detail
router.get("/teacher/:id", getSingleTeacher);


export default router;
