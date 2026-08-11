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

    if (!customerName) {
      return res.status(404).json({
        message: "customer name is required",
      });
    }
    if (!customerPhone) {
      return res.status(404).json({
        message: "customer phone is required",
      });
    }
    if (!service) {
      return res.status(404).json({
        message: "service is required",
      });
    }
    if (!description) {
      return res.status(404).json({
        message: "description is required",
      });
    }
    if (!numberOfItems) {
      return res.status(404).json({
        message: "number of items is required",
      });
    }
    if (!price) {
      return res.status(404).json({
        message: "price is required",
      });
    }

    // Create the order
    const order = await orderModel.create({
      customerName,
      customerPhone,
      service,
      description,
      numberOfItems,
      price,
      pickupDate,
    });

    // await sendEmail(
    //   user.email,
    //   "Welcome to BlackFinance",
    //   "signUp",
    //   placeholders,
    // );
    await order.save();

    // Prepare user details for response
    const orderDetails = {
      _id: order._id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      service: order.service,
      description: order.description,
      numberOfItems: order.numberOfItems,
      price: order.price,
      pickupDate: order.pickupDate,
      status: order.status,
    };

    // Send success response
    res.status(201).json({
      message: `Welcome, ${order.customerName}. check your email for verification`,
      data: orderDetails,
    });
  } catch (err) {
    res.status(500).json({
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
