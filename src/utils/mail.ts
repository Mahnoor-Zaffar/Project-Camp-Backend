import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

interface SendEmailOptions {
  email: string;
  subject: string;
  mailgenContent: Mailgen.Content;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  if (
    !env.MAILTRAP_SMTP_HOST ||
    !env.MAILTRAP_SMTP_PORT ||
    !env.MAILTRAP_SMTP_USER ||
    !env.MAILTRAP_SMTP_PASS
  ) {
    console.warn("Email credentials not configured; skipping email send.");
    return;
  }

  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Camp",
      link: env.SERVER_URL,
    },
  });

  const transporter = nodemailer.createTransport({
    host: env.MAILTRAP_SMTP_HOST,
    port: env.MAILTRAP_SMTP_PORT,
    auth: {
      user: env.MAILTRAP_SMTP_USER,
      pass: env.MAILTRAP_SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: "noreply@projectcamp.io",
      to: options.email,
      subject: options.subject,
      text: mailGenerator.generatePlaintext(options.mailgenContent),
      html: mailGenerator.generate(options.mailgenContent),
    });
  } catch (error) {
    const { logger } = await import("./logger.js");
    logger.error({ err: error }, "Email service failed");
  }
};

export const emailVerificationMailgenContent = (
  username: string,
  verificationUrl: string,
): Mailgen.Content => ({
  body: {
    name: username,
    intro: "Welcome to Project Camp! Please verify your email to get started.",
    action: {
      instructions: "Click the button below to verify your email address.",
      button: {
        color: "#22BC66",
        text: "Verify Email",
        link: verificationUrl,
      },
    },
    outro: "If you did not create an account, you can safely ignore this email.",
  },
});

export const forgotPasswordMailgenContent = (
  username: string,
  passwordResetUrl: string,
): Mailgen.Content => ({
  body: {
    name: username,
    intro: "We received a request to reset your password.",
    action: {
      instructions: "Click the button below to reset your password.",
      button: {
        color: "#22BC66",
        text: "Reset Password",
        link: passwordResetUrl,
      },
    },
    outro: "If you did not request a password reset, you can safely ignore this email.",
  },
});
