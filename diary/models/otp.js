// models/otp.js

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // OTP will expire in 10 minutes (adjust as needed)
  },
});

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
