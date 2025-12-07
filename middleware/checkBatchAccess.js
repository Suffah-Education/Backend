import Batch from "../models/batch.model.js";
import Subscription from "../models/subscription.model.js";

export const checkBatchAccess = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const userId = req.user._id;

        console.log("🔍 checkBatchAccess - batchId:", batchId, "userId:", userId, "role:", req.user.role);

        const batch = await Batch.findById(batchId);
        if (!batch) {
            console.log("❌ Batch not found:", batchId);
            return res.status(404).json({ message: "Batch not found" });
        }

        console.log("✅ Batch found:", batch.name);

        // ✅ Teacher & Admin free access
        if (req.user.role === "teacher" || req.user.role === "admin") {
            console.log("✅ Teacher/Admin access granted");
            req.isEnrolled = true;
            return next();
        }

        console.log("🔍 Looking for subscription...");
        const subscription = await Subscription.findOne({
            student: userId,
            batch: batchId
        });

        console.log("📋 Subscription found:", subscription ? "YES" : "NO");


        // 🔴 If subscription EXISTS → check expiry
        if (subscription) {
            const now = new Date();

            // ✅ Batch completed logic
            if (batch.isCompleted) {
                if (subscription.hasEverPaid) {
                    req.isEnrolled = true;
                    return next();
                }
                return res.status(403).json({
                    message: "This batch is completed. Only paid students can view content."
                });
            }

            // ✅ Subscription expired
            if (subscription.expiryDate < now) {
                subscription.status = "expired";
                await subscription.save();

                return res.status(402).json({
                    message: "Subscription expired. Please renew.",
                    expired: true,
                    price: batch.price,
                    batchName: batch.name,  // ⭐ ADD THIS
                });

            }

            // ✅ Active subscription
            req.isEnrolled = true;
            return next();
        }

        // 🔵 If no subscription → just preview allowed
        req.isEnrolled = false;
        return next();

    } catch (error) {
        console.error("❌ CheckBatchAccess Error:", error);
        console.error("Stack trace:", error.stack);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
