import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendMail({
        to: user.email,
        subject: "Reset Password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Permintaan Reset Password</h2>
            <p>Halo ${user.name || ""},</p>
            <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk melanjutkan:</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </p>
            <p style="color: #666; font-size: 14px;">Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
          </div>
        `,
        text: `Halo ${user.name || ""}, gunakan link berikut untuk mereset password akun Anda: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    async sendVerificationEmail({ user, url }) {
      await sendMail({
        to: user.email,
        subject: "Verifikasi Email Akun Anda",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verifikasi Email</h2>
            <p>Halo ${user.name || ""},</p>
            <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verifikasi Email</a>
            </p>
            <p style="color: #666; font-size: 14px;">Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:</p>
            <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
          </div>
        `,
        text: `Halo ${user.name || ""}, verifikasi email akun Anda melalui link berikut: ${url}`,
      });
    },
  },
});

export type Session = typeof auth.$Infer.Session;
