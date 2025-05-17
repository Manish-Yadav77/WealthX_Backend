import UserPayment from "../Models/UserPayment.js";
import QrCode from "../Models/QrModel.js";

// Get all user payment requests
export const getUserRequests = async (req, res) => {
  try {
    const requests = await UserPayment.find().sort({ _id: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

// Accept or reject a specific request
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updated = await UserPayment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
};

// Upload QR codes
export const uploadQrCodes = async (req, res) => {
  try {
    const { qr1, qr2 } = req.body;

    let qrRecord = await QrCode.findOne();

    if (!qrRecord) {
      qrRecord = new QrCode({ qr1, qr2 });
    } else {
      if (qr1) qrRecord.qr1 = qr1;
      if (qr2) qrRecord.qr2 = qr2;
    }

    await qrRecord.save();

    res.json({ message: "QR codes saved", qr1: qrRecord.qr1, qr2: qrRecord.qr2 });
  } catch (error) {
    res.status(500).json({ message: "Error saving QR codes" });
  }
};

// Fetch current QR codes
export const getQrCodes = async (req, res) => {
  try {
    const qr = await QrCode.findOne();
    if (!qr) {
      return res.json({ qr1: "", qr2: "" });
    }
    res.json({ qr1: qr.qr1, qr2: qr.qr2 });
  } catch (error) {
    res.status(500).json({ message: "Error fetching QR codes" });
  }
};
