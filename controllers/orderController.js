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

    const allowedStatuses = [
      "pending",
      "completed",
      "in-progress",
      "awaiting-pickup",
    ];

    const filter = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values are: ${allowedStatuses.join(", ")}`,
        });
      }
      filter.status = status;
    }

    const orders = await orderModel.find(filter);

    res.status(200).json({
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
