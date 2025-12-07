import Batch from '../models/batch.model.js';
import Student from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';

export const createBatch = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Only teachers can create batches." });
    }

    const {
      name,
      code,
      startDate,
      endDate,
      capacity,
      description,
      duration,
      syllabus,
      price
    } = req.body;

    if (!name || !code || !startDate || !capacity) {
      return res.status(400).json({
        message: "Please fill all required fields: name, code, startDate, capacity."
      });
    }

    const exists = await Batch.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: `Batch code '${code}' already exists.` });
    }

    const newBatch = await Batch.create({
      name,
      code,
      startDate,
      endDate,
      capacity,
      description,
      duration,
      syllabus,
      price,
      teacher: req.user._id,
    });

    res.status(201).json({
      message: "Batch created successfully",
      newBatch,
    });

  } catch (err) {
    console.error("Create Batch Error:", err);
    res.status(500).json({ message: "Server error while creating batch." });
  }
};


export const getTeacherBatches = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied. Only teachers can view their batches." });
    }

    // Find all batches where the 'teacher' field matches the logged-in user's ID
    const batches = await Batch.find({ teacher: req.user._id }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      batches,
      count: batches.length,
    });

  } catch (err) {
    console.error("Fetch Batches Error:", err);
    res.status(500).json({ message: "Server error while fetching batches." });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batch.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to delete this batch" });
    }
    await Batch.findByIdAndDelete(req.params.id);
    res.json({ message: "Batch deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting batch" });
  }
}



export const gettAlBatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      Batch.find()
        .populate('teacher', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Batch.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: "Batches fetched successfully",
      batches,
      currentPage: page,
      totalPages,
      total,
    });
  } catch (error) {
    console.error("Fetch All Batches Error:", error);
    res.status(500).json({ message: "Server error while fetching all batches." });
  }
}

export const getSingleBatch = async (req, res) => {
  try {
    console.log("🔍 getSingleBatch - id:", req.params.id, "user:", req.user._id, "role:", req.user.role, "isEnrolled:", req.isEnrolled);

    const batch = await Batch.findById(req.params.id)
      .populate("teacher", "name")
      .populate("students", "name phone city profilepic")
      .lean();

    if (!batch) {
      console.log("❌ Batch not found in getSingleBatch");
      return res.status(404).json({ message: "Batch not found" });
    }

    console.log("✅ Batch found in getSingleBatch:", batch.name);

    if (
      req.user.role !== "teacher" &&
      req.user.role !== "admin" &&
      !req.isEnrolled
    ) {
      // Since batch is lean(), it's already a plain object
      const sanitizedBatch = { ...batch }; // ⭐ FIX

      // Hide sensitive fields
      delete sanitizedBatch.classes;
      delete sanitizedBatch.messages;
      delete sanitizedBatch.students;

      return res.json(sanitizedBatch);
    }



    console.log("✅ Sending full batch data");
    res.json(batch);
  } catch (err) {
    console.error("❌ getSingleBatch Error:", err);
    res.status(500).json({ message: "Error fetching batch", error: err.message });
  }
};


export const sendBatchMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    batch.messages.push({
      sender: req.user._id,
      text: message
    });

    await batch.save();

    res.json({ message: "Message sent!", batch });
  } catch (err) {
    res.status(500).json({ message: "Error sending message" });
  }
};


export const updateBatch = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "code",
      "startDate",
      "endDate",
      "capacity",
      "description",
      "duration",
      "syllabus",
      "price",
      "status"
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    // check permission
    if (batch.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to update this batch" });
    }

    const updateBatch = await batch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json({ message: "Batch updated successfully", batch: updateBatch });
  } catch (err) {
    console.error("update batch error", err);
    res.status(500).json({ message: "Error updating batch" });
  }
};


export const addClassToBatch = async (req, res) => {
  try {
    const { title, link } = req.body;

    if (!title || !link) {
      return res.status(400).json({ message: "Title and link are required" });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    // Only teacher who owns the batch can add class
    if (batch.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    batch.classes.push({ title, link });
    await batch.save();

    res.json({ message: "Class added", classes: batch.classes });
  } catch (err) {
    res.status(500).json({ message: "Error adding class" });
  }
};


// 👨‍🎓 GET TEACHER'S STUDENTS
// Fetch all students enrolled in any of the teacher's batches
export const getTeacherStudents = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: "Access denied. Only teachers can view their students." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get all batches created by this teacher
    const batches = await Batch.find({ teacher: req.user._id }).populate(
      "students",
      "name phone city profilepic dob address"
    ).lean();

    // Collect unique students from all batches
    const studentMap = new Map();
    batches.forEach((batch) => {
      batch.students.forEach((student) => {
        if (!studentMap.has(student._id.toString())) {
          studentMap.set(student._id.toString(), {
            ...student,  // FIXED
            batches: [{ _id: batch._id, name: batch.name }],
          });
        } else {
          const existing = studentMap.get(student._id.toString());
          existing.batches.push({ _id: batch._id, name: batch.name });
          studentMap.set(student._id.toString(), existing);
        }
      });
    });


    const allStudents = Array.from(studentMap.values());
    const total = allStudents.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedStudents = allStudents.slice(skip, skip + limit);

    res.json({
      message: "Students fetched successfully",
      students: paginatedStudents,
      currentPage: page,
      totalPages,
      total,
    });
  } catch (err) {
    console.error("Get Teacher Students Error:", err);
    res.status(500).json({ message: "Server error while fetching students." });
  }
};


export const getMyEnrolledBatches = async (req, res) => {
  try {
    if (req.user.role !== "student")
      return res.status(403).json({ message: "Only students allowed" });

    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const student = await Student.findById(userId);

    if (!student || !student.enrolledBatches)
      return res.json({ batches: [], currentPage: page, totalPages: 0, total: 0 });

    const total = student.enrolledBatches.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedBatchIds = student.enrolledBatches.slice(skip, skip + limit);

    const fullBatches = await Batch.find({
      _id: { $in: paginatedBatchIds },
    })
      .populate("teacher", "name photo profilepic")
      .populate("students", "name city profilepic")
      .lean();

    const subscriptions = await Subscription.find({
      student: userId,
    });

    const now = new Date();

    const finalBatches = fullBatches.map((batch) => {

      // ✅ Find subscription safely
      const sub = subscriptions.find(
        (s) =>
          s.batch &&                   // ensure not null
          s.batch.toString() === batch._id.toString()
      );

      let isExpired = true;   // default expired

      if (sub && sub.expiryDate) {
        const expiry = new Date(sub.expiryDate);
        isExpired = expiry < now;
      }

      return {
        ...batch,
        isSubscriptionExpired: isExpired,
        expiryDate: sub?.expiryDate || null,
      };
    });

    res.json({
      batches: finalBatches,
      currentPage: page,
      totalPages,
      total,
    });

  } catch (err) {
    console.error("❌ getMyEnrolledBatches error:", err);
    res.status(500).json({ message: "Error fetching enrolled batches", error: err.message });
  }
};




export const completeBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batch.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to complete this batch" });
    }

    batch.isCompleted = true;
    batch.completedAt = new Date();

    await batch.save();

    res.json({ message: "Batch marked as completed" });


  } catch (error) {
    console.error("Error completing batch:", error);
    res.status(500).json({ message: "Server error" });
  }
}



export const getAllBatchesForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      Batch.find()
        .populate("teacher", "name photo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Batch.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      batches,
      currentPage: page,
      totalPages,
    });

  } catch (error) {
    console.error("Error fetching admin batches:", error);
    res.status(500).json({ message: "Failed to fetch batches" });
  }
};

