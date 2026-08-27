import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/**
 * Kirim email umum menggunakan nodemailer
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
  from = process.env.SMTP_FROM || `"Support" <${process.env.SMTP_USER}>`,
}: SendMailOptions) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    return { success: false, error };
  }
}

/**
 * Helper untuk verifikasi koneksi SMTP server
 */
export async function verifySmtpConnection() {
  try {
    await transporter.verify();
    console.log("Koneksi SMTP berhasil diverifikasi.");
    return true;
  } catch (error) {
    console.error("Koneksi SMTP gagal:", error);
    return false;
  }
}
