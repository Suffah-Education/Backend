import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    startDate: {
      type: Date,
      required: true
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },

    hasEverPaid: {
      type: Boolean,
      default: true
    },

    paymentId: String,
    orderId: String
  },
  { timestamps: true }
);

subscriptionSchema.index({ student: 1 });
subscriptionSchema.index({ batch: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ expiryDate: 1 });

// Unique pair per batch
subscriptionSchema.index({ student: 1, batch: 1 }, { unique: true });
const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
