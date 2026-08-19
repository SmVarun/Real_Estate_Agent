import nodemailer from "nodemailer";
import credential from "../config/config.js";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: credential.senderEmail,
        pass: credential.appPassword,
      },
    });
  }

  return transporter;
};

const verifyEmailConnection = async () => {
  try {
    await getTransporter().verify();
    return { success: true, message: "SMTP connection verified" };
  } catch (error) {
    const verifyError = new Error(
      `SMTP connection verification failed: ${error.message}`
    );
    verifyError.statusCode = 502;
    throw verifyError;
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: credential.senderEmail,
      to,
      subject,
      html,
      text,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    const sendError = new Error(`Failed to send email: ${error.message}`);
    sendError.statusCode = 502;
    throw sendError;
  }
};

export { sendEmail, verifyEmailConnection };
