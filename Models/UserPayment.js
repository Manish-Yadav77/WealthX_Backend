import mongoose from "mongoose";

const userPaymentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  utr: String,
  plan: String,
  status: {
    type: String,
    enum:['Accepted', 'Rejected', 'Pending'],
    default:'Pending'
},
  submittedAt: Date,
  screenshotPath: String,
  loggedInEmail: String,
});

const UserPayment = mongoose.model('UserPayment', userPaymentSchema);
export default UserPayment;
