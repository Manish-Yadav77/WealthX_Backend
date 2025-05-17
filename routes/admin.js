import express from "express";
import {
  getUserRequests,
  updateRequestStatus,
  uploadQrCodes,
  getQrCodes,
} from "../controllers/adminController.js";

const router = express.Router();

// GET all user subscription/payment requests
router.get("/requests", getUserRequests);

// PUT update request status (accept/reject)
router.put("/requests/:id", updateRequestStatus);

// POST upload QR codes
router.post("/qr", uploadQrCodes);

// GET current QR codes
router.get("/qr", getQrCodes);

export default router;
