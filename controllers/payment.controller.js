import crypto from 'crypto';
import { razorpayInstance } from '../lib/razorpay.js';
import Batch from '../models/batch.model.js';
import Student from '../models/user.model.js'

export const createOrder = async (req, res) => {
  try {
    const { batchId } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const options = {
      amount: batch.price * 100,
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
    console.log(err);
    res.status(500).json({ message: "Order creation failed" });
  }
}


export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, batchId } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // ENROLL STUDENT
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add student to batch.students if not already present
    const studentInBatch = batch.students.some((id) => id.toString() === student._id.toString());
    if (!studentInBatch) {
      batch.students.push(student._id);
      await batch.save();
    }

    // Add batch to student.enrolledBatches if not already present
    const batchInStudent = student.enrolledBatches.some((id) => id.toString() === batchId.toString());
    if (!batchInStudent) {
      student.enrolledBatches.push(batchId);
      await student.save();
    }

    const updatedUser = await Student.findById(req.user._id).populate("enrolledBatches", "name");

    res.json({
      success: true,
      message: "Enrollment successful!",
      user: updatedUser
    });

  } catch (error) {
    console.log("Payment verification error:", error);
    res.status(500).json({ message: "Payment verifying error" });
  }
};
