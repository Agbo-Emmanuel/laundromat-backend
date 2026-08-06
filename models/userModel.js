const mongoose = require("mongoose");

const mySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  accntBalance: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: ["admin", "worker"],
    default: "worker",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String, // Store the URL of the image
    default: null, // Default value in case no image is uploaded
  },
});

const myModel = mongoose.model("User", mySchema);
module.exports = myModel;
