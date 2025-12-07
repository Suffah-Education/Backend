// controllers/admin.controller.js
import Teacher from "../models/teacher.model.js";

// 🟠 Fetch pending teachers with pagination
export const getPendingTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      Teacher.find({ approvedByAdmin: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Teacher.countDocuments({ approvedByAdmin: false }),
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({ teachers, currentPage: page, totalPages });
  } catch (err) {
    console.error("Pagination error:", err);
    res.status(500).json({ message: "Error fetching pending teachers" });
  }
};

// 🟢 Fetch approved teachers (with pagination)
export const getApprovedTeachers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      Teacher.find({ approvedByAdmin: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name education photo email")
        .lean(),
      Teacher.countDocuments({ approvedByAdmin: true }),
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({ teachers, currentPage: page, totalPages: Math.ceil(total / limit), });
  } catch (error) {
    console.error("Error fetching approved teachers:", error);
    res.status(500).json({ message: "Error fetching approved teachers" });
  }
};

// ✅ Approve a teacher by ID
export const approveTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { approvedByAdmin: true },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json({ message: "Teacher approved successfully", teacher });
  } catch (err) {
    console.error("Error approving teacher:", err);
    res.status(500).json({ message: "Error approving teacher" });
  }
};

// ❌ Reject a teacher by ID (delete)
export const rejectTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json({ message: "Teacher rejected and removed" });
  } catch (err) {
    console.error("Error rejecting teacher:", err);
    res.status(500).json({ message: "Error rejecting teacher" });
  }
};


// 🔍 Get full teacher details by ID
export const getSingleTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (err) {
    console.error("Error fetching teacher details:", err);
    res.status(500).json({ message: "Error fetching teacher details" });
  }
};
