const orderModel = require("../models/orderModel");
const bcrypt = require("bcryptjs");
const validation = require("../validation/validation");
const jwt = require("jsonwebtoken");
const {
  sendEmail,
  sendMulEmail,
  sendMailToAdmin,
  sendResetPasswordEmail,
  sendUserEmail,
} = require("../utils/mailer");

const crypto = require("crypto");
const mongoose = require("mongoose");

const ALLOWED_STATUSES = [
  "pending",
  "completed",
  "in-progress",
  "awaiting-pickup",
];

// Generates a 6-character alphanumeric code (uppercase letters + digits)
const generateOrderCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `ORD-${code}`;
};

// Ensures the generated code doesn't already exist in the DB
const generateUniqueOrderCode = async () => {
  let code;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 5) {
    code = generateOrderCode();
    exists = await orderModel.exists({ orderCode: code });
    attempts++;
  }

  if (exists) {
    throw new Error("Could not generate a unique order code, please try again");
  }

  return code;
};

exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      service,
      description,
      numberOfItems,
      price,
      pickupDate,
    } = req.body;

    const requiredFields = {
      customerName: "customer name",
      customerPhone: "customer phone",
      service: "service",
      description: "description",
      numberOfItems: "number of items",
      price: "price",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        return res.status(400).json({
          message: `${label} is required`,
        });
      }
    }

    const orderCode = await generateUniqueOrderCode();

    // Create the order (create() already persists it, no need to call save() again)
    const order = await orderModel.create({
      customerName,
      customerPhone,
      service,
      description,
      numberOfItems,
      price,
      pickupDate,
      orderCode,
    });

    // Prepare order details for response
    const orderDetails = {
      _id: order._id,
      orderCode: order.orderCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      service: order.service,
      description: order.description,
      numberOfItems: order.numberOfItems,
      price: order.price,
      pickupDate: order.pickupDate,
      status: order.status,
    };

    return res.status(201).json({
      message: `Order ${order.orderCode} has been created successfully`,
      data: orderDetails,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values are: ${ALLOWED_STATUSES.join(", ")}`,
        });
      }
      filter.status = status;
    }

    const orders = await orderModel.find(filter);

    return res.status(200).json({
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "order id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "invalid order id",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "order not found",
      });
    }

    return res.status(200).json({
      message: "order fetched successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "order id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "invalid order id",
      });
    }

    if (!status) {
      return res.status(400).json({
        message: "status is required",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values are: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true },
    );

    if (!order) {
      return res.status(404).json({
        message: "order not found",
      });
    }

    return res.status(200).json({
      message: `order status updated to ${status} successfully`,
      data: order,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
