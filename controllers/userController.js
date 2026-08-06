const myModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const validation = require("../validation/validation");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const {
  sendEmail,
  sendMulEmail,
  sendMailToAdmin,
  sendResetPasswordEmail,
  sendUserEmail,
} = require("../utils/mailer");
const cron = require("node-cron");
// const Plan = require('./path/to/planModel');
const cloudinary = require("cloudinary").v2;

exports.signUp = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } =
      req.body;

    // Check password and confirmPassword
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and confirm password do not match",
      });
    }

    // Validate user input using Joi or another validator
    try {
      await validation.validateAsync(req.body);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Check if the user already exists
    const userExists = await myModel.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: `User with email: ${userExists.email} already exists`,
      });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    // const verificationToken = bcrypt.hashSync("verify-token", salt);
    const verificationToken = jwt.sign({ email }, process.env.SECRET, {
      expiresIn: "1d",
    }); // Using JWT to generate the token

    // Create the user
    const user = await myModel.create({
      fullName,
      userName,
      email,
      phoneNumber,
      password: hash,
      accntBalance: 0,
      totalDeposit: 0,
      totalProfit: 0,
      isAdmin: false,
      isVerified: false,
      isKycVerified: false,
      transactions: [],
      plan: [],
      token: verificationToken,
    });

    // Prepare email placeholders
    const placeholders = {
      "{{ fullName }}": user.fullName,
      "{{ verification_link }}": `${process.env.SERVER_URL}/api/v1/verify-email?token=${verificationToken}&email=${user.email}`,
    };

    await sendEmail(
      user.email,
      "Welcome to BlackFinance",
      "signUp",
      placeholders,
    );

    // Generate JWT token for the user
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      process.env.SECRET,
      { expiresIn: "1d" },
    );

    // Save the token in the user object
    user.token = token;
    await user.save();

    // Prepare user details for response
    const userDetails = {
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        accntBalance: user.accntBalance,
        totalDeposit: user.totalDeposit,
        totalProfit: user.totalProfit,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        isKycVerified: user.isKycVerified,
        transactions: user.transactions,
        plan: user.plan,
      },
    };

    // Send success response
    res.status(201).json({
      message: `Welcome, ${user.userName}. check your email for verification`,
      data: userDetails,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Ensure the email matches the token payload
    if (decoded.email !== email) {
      return res.status(400).json({ message: "Invalid verification link" });
    }

    // Find the user by email
    const user = await myModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Update user's isVerified status
    user.isVerified = true;
    await user.save();

    // Send the second email with the second HTML template after verification
    const placeholders = {
      "{{ fullName }}": user.fullName, // Customize as needed
    };

    await sendEmail(email, "Welcome to Finfrevia", "welcome", placeholders);

    // Redirect the user to the login page
    res.redirect(`${process.env.CLIENT_URL}/login`);
  } catch (err) {
    res.status(500).json({ message: "Invalid or expired token" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(404).json({
        message: "email is required",
      });
    }

    if (!password) {
      return res.status(404).json({
        message: "password is required",
      });
    }

    const user = await myModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified == false) {
      return res.status(404).json({
        message: "please go to your email to verify your account",
      });
    }

    // Check if the provided password is correct
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // Create and sign a JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      process.env.SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    // Verify the token from the Authorization header
    const rToken = req.headers.authorization?.split(" ")[1];

    if (!rToken) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Verify and decode the token
    const decoded = jwt.verify(rToken, process.env.SECRET);

    // Fetch user by ID from decoded token
    const user = await myModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const formatAmount = (value) => {
      // Ensure the value is a string
      const stringValue = value.toString();

      // Remove non-digit characters except for the decimal point
      const numericValue = stringValue.replace(/[^0-9.]/g, ""); // Keep digits and decimal points
      if (!numericValue) return "";

      // Split the value into integer and decimal parts
      const [integerPart, decimalPart] = numericValue.split(".");

      // Format the integer part with commas
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ",",
      );

      // Return the formatted value, including the decimal part if it exists
      return decimalPart
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
    };

    const userAccntBalance = formatAmount(user.accntBalance);
    const usertotalDeposit = formatAmount(user.totalDeposit);
    const usertotalProfit = formatAmount(user.totalProfit);

    // Send the user details as a response
    res.status(200).json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        accntBalance: userAccntBalance,
        totalDeposit: usertotalDeposit,
        totalProfit: usertotalProfit,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        isKycVerified: user.isKycVerified,
        transactions: user.transactions,
        plan: user.plan,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Define the absolute path for the uploads folder
const uploadDir = path.join(__dirname, "uploads");

// Ensure that the uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use the absolute uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for the image
}).single("receipt"); // Expecting the receipt under the 'receipt' field

exports.updateUserRole = async (req, res) => {
  try {
    const { userId, makeAdmin } = req.body;

    // Find the user to be updated
    const user = await myModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's admin status
    user.isAdmin = makeAdmin;
    await user.save();

    res.status(200).json({
      message: `User with ID ${userId} has been ${makeAdmin ? "promoted to admin" : "demoted from admin"}.`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        accntBalance: user.accntBalance,
        totalDeposit: user.totalDeposit,
        totalProfit: user.totalProfit,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        isKycVerified: user.isKycVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the user to be updated
    const user = await myModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's admin status
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      message: `User with ID ${userId} has been verified.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const allUser = await myModel.find();
    const user = allUser.filter((e) => e.isAdmin !== true);
    const reversedUsers = user.reverse();
    res.status(200).json(reversedUsers);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Extract userId from request body
    const { userId } = req.body;

    // Ensure userId is provided
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Find and delete the user by ID
    const user = await myModel.findByIdAndDelete(userId);

    // Check if the user was found and deleted
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: `User with ID ${userId} has been deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.sendMailToAllUsers = async (req, res) => {
  try {
    let { emails, message, subject } = req.body;

    // If only one email is provided as a string, convert it to an array
    if (typeof emails === "string") {
      emails = [emails]; // Convert single email string to an array
    }

    // Validate that emails is an array and contains at least one email
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one valid email is required." });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const placeholders = {
      "{{ verification_link }}": `${message}`,
    };

    // Send the email(s) using the mailer
    await sendMulEmail(emails, subject, "adminMessage", placeholders);

    res.status(200).json({ success: "Email(s) sent successfully." });
  } catch (err) {
    console.error("Error in /send-email:", err);
    res.status(500).json({ error: "Failed to send email(s)." });
  }
};

exports.getAllUserEmails = async (req, res) => {
  try {
    // Fetch all users
    const allUsers = await myModel.find();

    // Filter out admin users and extract their emails
    const userEmails = allUsers
      .filter((user) => user.isAdmin !== true) // Filter non-admin users
      .map((user) => user.email); // Map to only get email addresses

    // Return the array of emails as a response
    res.status(200).json(userEmails);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.sendMailToAdmin = async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email) {
      return res.status(400).json({ error: "your email address is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "please enter your message" });
    }

    const user = await myModel.findOne({ email: email });
    // If user is not found, return an error
    if (!user) {
      return res.status(404).json({ error: "The email is not registered" });
    }

    const subject = user.userName;

    await sendMailToAdmin(email, message, subject);

    res.status(200).json({
      success: "Email sent successfully. the admin will get back to you",
    });
  } catch (err) {
    console.error("Error in /send-email:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
};

// Function to create a countdown for a specific plan
// const startCountdownForPlan = async (userId,planId) => {
//     const user = await myModel.findById(userId);
//     const Plan = user.plan.id(planId);
//     cron.schedule('0 0 * * *', async () => { // Runs every day at midnight
//         const plan = await Plan.findOne({ _id: planId, isActive: true });

//         if (plan && plan.remainingDays > 0) {
//             plan.remainingDays -= 1;
//             if (plan.remainingDays === 0) {
//                 plan.isActive = false; // Deactivate plan when countdown reaches zero
//             }
//             await plan.save();
//             console.log(`Updated remainingDays for plan ${planId}`);
//         } else {
//             // If plan is inactive or does not exist, stop this cron job
//             this.stop();
//         }
//     });
// };

const startCountdownForPlan = async (userId, planId) => {
  const user = await myModel.findById(userId);
  const plan = user.plan.id(planId);

  if (!plan) {
    console.log(`Plan with id ${planId} not found for user ${userId}`);
    return;
  }

  const job = cron.schedule("0 0 * * *", async () => {
    // Runs every day at midnight
    if (plan.isActive && plan.remainingDays > 0) {
      plan.remainingDays -= 1;
      if (plan.remainingDays === 0) {
        plan.isActive = false; // Deactivate plan when countdown reaches zero
      }
      await user.save();
      console.log(`Updated remainingDays for plan ${planId}`);
    } else {
      console.log(`Stopping cron job for plan ${planId}`);
      job.stop(); // Stop the job if plan is inactive or remainingDays is zero
    }
  });
};

exports.sendResetPassword = async (req, res) => {
  const { email } = req.body;

  // Check if the user exists
  const user = await myModel.findOne({ email });
  if (!user) {
    return res.status(400).send("User with this email does not exist");
  }

  // Generate a reset token (could use JWT or a random string)
  const token = jwt.sign({ id: user._id }, process.env.SECRET, {
    expiresIn: "1h",
  });

  // Create a password reset link
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const placeholders = {
    "{{ verification_link }}": `${resetLink}`,
  };

  // Send email with the reset link
  await sendResetPasswordEmail(
    user.email,
    "Password Reset",
    "resetPassword",
    placeholders,
  );

  res.send("Password reset email has been sent");
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Find the user by ID and update their password
    const user = await myModel.findById(decoded.id);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    //   const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.send("Password has been reset");
  } catch (error) {
    res.status(400).send("Invalid or expired token");
  }
};

exports.sendUserMessage = async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email) {
      return res.status(400).send("email is required");
    }
    if (!message) {
      return res.status(400).send("there is no message to be sent");
    }

    const placeholders = {
      "{{ verification_link }}": `${message}`,
    };

    sendUserEmail(email, "adminMessage", placeholders);

    res.status(200).json({
      message: "message sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: err.message,
    });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.editUserAccount = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("File upload error:", err);
      return res.status(500).json({
        message: "Error uploading file",
        error: err.message || "Unknown error",
      });
    }

    try {
      // Validate token
      const rToken = req.headers.authorization?.split(" ")[1];
      if (!rToken) {
        return res.status(401).json({ message: "Authorization token missing" });
      }

      // Verify token
      const decoded = jwt.verify(rToken, process.env.SECRET);
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Find user by ID
      const user = await myModel.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Destructure input data
      const { fullName, userName, email, phoneNumber } = req.body;

      // Prepare updated user data
      const updatedUser = {};
      if (fullName) updatedUser.fullName = fullName.trim();
      if (userName) updatedUser.userName = userName.trim();
      if (email) updatedUser.email = email.trim().toLowerCase(); // Sanitize email
      if (phoneNumber) updatedUser.phoneNumber = phoneNumber.trim();

      // Handle file upload to Cloudinary
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "user_profiles",
            use_filename: true,
            unique_filename: false,
          });
          updatedUser.profileImage = result.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload error:", uploadErr);
          return res
            .status(500)
            .json({ message: "Failed to upload profile image" });
        }
      }

      // Update user in the database
      const updated = await myModel.findByIdAndUpdate(user._id, updatedUser, {
        new: true, // Return updated user
        runValidators: true, // Ensure schema validation
      });

      if (!updated) {
        return res
          .status(400)
          .json({ message: "Failed to update user account" });
      }

      // Success response
      res.status(200).json({
        message: "User account updated successfully",
        user: updated,
      });
    } catch (err) {
      console.error("Error in editUserAccount:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
};
