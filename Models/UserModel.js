// models/UserModel.js

import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  img:String,
  role:{
    type:String,
    enum:['user','Admin'],
    default:'user'
},
Package:{
    type: String,
    enum:['Plan 1','Plan 2', 'Plan 3', 'Plan 4', 'None'],
    default:'None'
},
// status:{
//     type: String,
//     enum:['Accepted', 'Rejected', 'Pending'],
//     default:'Pending'
// }
},{timestamps:true});

const User = mongoose.model("User", userSchema);
export default User;
