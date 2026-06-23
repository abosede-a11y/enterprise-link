const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Enterprise Link" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️  Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err);
    // Don't throw — email failure shouldn't break the request
  }
};

const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Enterprise Link',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your business account has been created successfully.</p>
      <p>You can now log in and start using Enterprise Link's financial services.</p>
      <br/>
      <p>The Enterprise Link Team</p>
    `,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the link below to set a new one:</p>
      <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Reset Password</a>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  }),

  documentsUnderReview: (name) => ({
    subject: 'Documents Received — Under Review',
    html: `
      <h2>Documents Received</h2>
      <p>Hi ${name},</p>
      <p>We have received your onboarding documents. Our team will review them within <strong>2–3 business days</strong>.</p>
      <p>You can track your onboarding progress from your dashboard.</p>
    `,
  }),

  onboardingComplete: (name, approved) => ({
    subject: approved ? 'Onboarding Successful 🎉' : 'Action Required — Onboarding Update',
    html: approved
      ? `
        <h2>You're Verified! 🎉</h2>
        <p>Hi ${name},</p>
        <p>Your onboarding is complete. You now have full access to all Enterprise Link services.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Go to Dashboard</a>
      `
      : `
        <h2>Onboarding Update</h2>
        <p>Hi ${name},</p>
        <p>There was an issue with your submitted documents. Please log in to review and re-upload the required files.</p>
        <a href="${process.env.CLIENT_URL}/onboarding" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">Review Documents</a>
      `,
  }),

  ticketReceived: (name, ticketNumber, subject) => ({
    subject: `Support Ticket #${ticketNumber} Received`,
    html: `
      <h2>Ticket Received</h2>
      <p>Hi ${name},</p>
      <p>We have received your support request:</p>
      <p><strong>Ticket #:</strong> ${ticketNumber}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p>Our support team will respond within <strong>24 hours</strong>. You can monitor your ticket status from your dashboard.</p>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
