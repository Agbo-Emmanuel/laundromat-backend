const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  signUp,
  login,
  getUser,
  updateUserRole,
  getAllUser,
  deleteUser,
  verifyEmail,
  sendMailToAllUsers,
  getAllUserEmails,
  sendMailToAdmin,
  verifyAccount,
  resetPassword,
  sendResetPassword,
  sendUserMessage,
  editUserAccount,
  getWorkerDashboardStats,
  getAdminDashboardStats,
} = require("../controllers/userController");
const { getAllOrders } = require("../controllers/orderController");

router.post("/auth/signup", signUp);
router.post("/auth/login", login);
router.patch("/update-user-role", updateUserRole);
router.get("/getalluser", getAllUser);
router.post("/deleteuser", deleteUser);
router.get("/verify-email", verifyEmail);
router.post("/send-email-to-all-users", sendMailToAllUsers);
router.get("/all-user-emails", getAllUserEmails);
router.post("/send-mail-to-admin", sendMailToAdmin);
router.post("/verifyaccount", verifyAccount);
router.post("/forgot-password", sendResetPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/send-user-message", sendUserMessage);
router.patch("/edit-account", editUserAccount);

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }
    req.userId = decoded.userId;
    next();
  });
};

router.get("/getuser", authenticate, getUser);
router.get("/worker/dashboard-stats", authenticate, getWorkerDashboardStats);
router.get("/admin/dashboard-stats", authenticate, getAdminDashboardStats);

//orders
router.get("/get-all-orders", getAllOrders);

module.exports = router;
