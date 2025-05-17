import mongoose from "mongoose";

const qrSchema = new mongoose.Schema({
  qr1: String,
  qr2: String,
}, { timestamps: true });

const Qr = mongoose.model("Qr", qrSchema);
export default Qr;
