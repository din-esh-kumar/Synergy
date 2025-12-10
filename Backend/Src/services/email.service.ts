import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // or any SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export class EmailService {
  static async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
  }) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
  }
}
