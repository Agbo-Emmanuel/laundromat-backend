const { Resend } = require("resend");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (
  email,
  subject,
  templateName,
  placeholders,
  attachments = [],
) => {
  const templatePath = path.join(
    __dirname,
    "../templates",
    `${templateName}.html`,
  );
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(placeholders)) {
    let regex = new RegExp(key, "g");
    html = html.replace(regex, value);
  }

  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject,
    html,
  };

  if (attachments.length > 0) {
    mailOptions.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: fs.readFileSync(att.path),
    }));
  }

  try {
    const { data, error } = await resend.emails.send(mailOptions);
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent successfully:", data.id);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendMulEmail = async (emailList, subject, templateName, placeholders) => {
  const templatePath = path.join(
    __dirname,
    "../templates",
    `${templateName}.html`,
  );
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(placeholders)) {
    let regex = new RegExp(key, "g");
    html = html.replace(regex, value);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: emailList,
      subject,
      html,
    });
    if (error) {
      console.error("Error sending emails:", error);
    } else {
      console.log("Emails sent successfully:", data.id);
    }
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

const sendMailToAdmin = async (email, message, subject) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      reply_to: email,
      to: process.env.ADMIN_EMAIL,
      subject: `${subject} mail`,
      text: message,
    });
    if (error) {
      console.error("Error sending emails:", error);
    } else {
      console.log("Admin email sent successfully:", data.id);
    }
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

const sendReceiptMail = async (
  user,
  amount,
  paymentType,
  receiptPath,
  receiptFilename,
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: "New Deposit Receipt",
      text: `A new deposit of ${amount} ${paymentType} has been made by ${user.fullName}. Please review the attached receipt.`,
      attachments: [
        {
          filename: receiptFilename,
          content: fs.readFileSync(receiptPath),
        },
      ],
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error;
  }
};

const sendWithdrawMail = async (user, amount, accountAddress, paymentType) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: "New Withdraw Request",
      text: `A new withdraw request has been made by ${user.fullName} with ${user.email}. Please wait for the user to complete the withdrawal payment before making payment to the following details:\n\n
            Payment Type:  ${paymentType}
            Address:       ${accountAddress}
            Amount:        $${amount}\n\n
            Please proceed with the necessary payments.`,
    });
    if (error) {
      console.error("Error sending emails:", error);
    } else {
      console.log("Withdraw request email sent:", data.id);
    }
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

const sendcompleteWithdrawMail = async (
  user,
  otherAmount,
  receiptPath,
  receiptFilename,
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: "Completed Withdrawal Payment",
      text: `${user.fullName} with ${user.email} is suppose to pay the amount of $${otherAmount} to complete the withdrawal payment process, please verify the transaction and make the payment`,
      attachments: [
        {
          filename: receiptFilename,
          content: fs.readFileSync(receiptPath),
        },
      ],
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error sending complete withdraw email:", error);
    throw error;
  }
};

const sendKycMail = async (
  user,
  fullName,
  identity,
  gender,
  occupation,
  billingAddress,
  ssn,
  receiptPath,
  receiptFilename,
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: process.env.ADMIN_EMAIL,
      subject: "KYC verification",
      text: `User with ${user.email} has completed the KYC verification process using the following details:\n\n
            Full Name: ${fullName}
            identifier: ${identity}
            Gender: ${gender}
            Occupation: ${occupation}
            Billing Address: ${billingAddress}
            SSN: ${ssn}
            `,
      attachments: [
        {
          filename: receiptFilename,
          content: fs.readFileSync(receiptPath),
        },
      ],
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error sending KYC email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (
  email,
  subject,
  templateName,
  placeholders,
) => {
  const templatePath = path.join(
    __dirname,
    "../templates",
    `${templateName}.html`,
  );
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(placeholders)) {
    let regex = new RegExp(key, "g");
    html = html.replace(regex, value);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject,
      html,
    });
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Reset password email sent:", data.id);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendUserEmail = async (email, templateName, placeholders) => {
  const templatePath = path.join(
    __dirname,
    "../templates",
    `${templateName}.html`,
  );
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(placeholders)) {
    let regex = new RegExp(key, "g");
    html = html.replace(regex, value);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: "Message from the Admin",
      html,
    });
    if (error) {
      console.error("Error sending emails:", error);
    } else {
      console.log("User email sent successfully:", data.id);
    }
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

// sendEmail("agboe4102@gmail.com", "Welcome to Finfrevia", "welcome", {
//   "{{fullName}}": "Agbo Emmanuel",
// });

module.exports = {
  sendEmail,
  sendMulEmail,
  sendMailToAdmin,
  sendReceiptMail,
  sendWithdrawMail,
  sendKycMail,
  sendcompleteWithdrawMail,
  sendResetPasswordEmail,
  sendUserEmail,
};
