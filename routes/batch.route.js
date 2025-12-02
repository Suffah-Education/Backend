import express from 'express';
import { protect } from '../middleware/protect.js'; // Path assumed
import { getAllBatchesForAdmin, createBatch, gettAlBatches, getTeacherBatches, getSingleBatch, sendBatchMessage, updateBatch, addClassToBatch, deleteBatch, getTeacherStudents, getMyEnrolledBatches, completeBatch } from '../controllers/batch.controller.js';
import { checkBatchAccess } from '../middleware/checkBatchAccess.js';

const router = express.Router();

// Route to create a new batch (Protected: requires login)
router.post('/', protect, createBatch);

// ⭐ GET routes with specific paths MUST come BEFORE generic /:id route
router.get('/mybatches', protect, getTeacherBatches);
router.get('/my-students', protect, getTeacherStudents);
router.get('/my-enrolled', protect, getMyEnrolledBatches);

// Generic routes
router.get('/:id', protect, checkBatchAccess, getSingleBatch);
router.post('/:id/message', protect, sendBatchMessage);
router.put('/:id', protect, updateBatch);
router.post('/:id/class', protect, addClassToBatch);
router.delete('/:id', protect, deleteBatch);

// Public route for all batches
router.get('/', gettAlBatches);
router.put('/:id/complete', protect, completeBatch);


router.get("/admin/all-batches", protect, getAllBatchesForAdmin);


export default router;