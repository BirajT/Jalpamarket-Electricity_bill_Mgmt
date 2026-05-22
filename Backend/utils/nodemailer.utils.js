import nodemailer from "nodemailer";
import { nodemailer_config } from "../config/config.js";

// create transport
const transport = nodemailer.createTransport({
  host: nodemailer_config.host,
  port: nodemailer_config.port,
  secure: parseInt(nodemailer_config.port) === 465 ? true : false,
  service: nodemailer_config.service,
  auth: {
    user: nodemailer_config.user,
    pass: nodemailer_config.pass,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
  cc = null,
  bcc = null,
  attachments = null,
}) => {
  const options = {
    to: to,
    from: nodemailer_config.user,
    subject: subject,
    html: html,
  };

  if (cc) {
    options["cc"] = cc;
  }
  if (bcc) {
    options["bcc"] = bcc;
  }
  if (attachments) {
    options["attachments"] = attachments;
  }
  try {
    await transport.sendMail(options);
  } catch (error) {
    console.log("email sending error");
  }
};
