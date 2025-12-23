import crypto from "crypto";
import { razorpayInstance } from "../lib/razorpay.js";
import Batch from "../models/batch.model.js";
import Student from "../models/user.model.js";
import Subscription from "../models/subscription.model.js"; // ⭐ IMPORTANT

// 🧾 CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { batchId } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const options = {
      amount: batch.price * 100, // in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      order,
      batchName: batch.name,
      price: batch.price,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

// ✅ VERIFY PAYMENT + ENROLL + SUBSCRIPTION (NEW)
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      batchId,
    } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 1️⃣ Razorpay signature verify
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // 2️⃣ Batch & Student find
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 3️⃣ ENROLLMENT (idempotent – bar-bar call ho to bhi safe)
    const studentInBatch = batch.students.some(
      (id) => id.toString() === student._id.toString()
    );
    if (!studentInBatch) {
      batch.students.push(student._id);
      await batch.save();
    }

    const batchInStudent = student.enrolledBatches.some(
      (id) => id.toString() === batchId.toString()
    );
    if (!batchInStudent) {
      student.enrolledBatches.push(batchId);
      await student.save();
    }

    // 4️⃣ SUBSCRIPTION CREATE / RENEW
    const now = new Date();

    // ⭐ TEST MODE: 2 minutes expiry (baad me 30 days ya 1 month kar dena)
    // const TEST_MINUTES = 2;
    // const expiryDate = new Date(now.getTime() + TEST_MINUTES * 60 * 1000);

    // ✅ LIVE MODE: 30 days subscription
    const DAYS = 30;
    const expiryDate = new Date(
      now.getTime() + DAYS * 24 * 60 * 60 * 1000
    );

    let subscription = await Subscription.findOne({
      student: student._id,
      batch: batch._id,
    });

    if (!subscription) {
      // 🔹 First time payment → naya subscription
      subscription = new Subscription({
        student: student._id,
        batch: batch._id,
        startDate: now,
        expiryDate,
        status: "active",
        hasEverPaid: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      // 🔁 RENEWAL → expiryDate + status update
      subscription.startDate = now; // ya pehle startDate rehne dena ho to comment kar sakta hai
      subscription.expiryDate = expiryDate;
      subscription.status = "active";
      subscription.hasEverPaid = true;
      subscription.paymentId = razorpay_payment_id;
      subscription.orderId = razorpay_order_id;
    }

    await subscription.save();

    // 5️⃣ Updated user (for frontend store)
    const updatedUser = await Student.findById(student._id).populate(
      "enrolledBatches",
      "name"
    );

    return res.json({
      success: true,
      message: "Enrollment / Renewal successful!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Payment verifying error" });
  }
};
