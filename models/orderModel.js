const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: Number,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  numberOfItems: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  pickupDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["completed", "pending", "awaiting-pickup"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

const orderModel = mongoose.model("Order", orderSchema);
module.exports = orderModel;
