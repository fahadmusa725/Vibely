const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'Reset your Vibely password',
    text: `Hi ${name},\n\nWe received a request to reset your Vibely password. Open the link below to choose a new one. It expires in 1 hour.\n\n${resetUrl}\n\nIf you did not ask for this, you can ignore this email.`,
  });
};

module.exports = { sendResetEmail };
