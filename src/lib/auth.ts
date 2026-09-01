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
        subject: "Reset Password — SMART BRMP SDLAHAN",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
            <div style="background: #143D32; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #fff; margin: 0; font-size: 18px; letter-spacing: 0.2em;">SMART</h1>
              <p style="color: #86efac; margin: 4px 0 0; font-size: 11px;">Sistem Monitoring, Analisis, Reporting & Tracking</p>
              <p style="color: #6ee7b7; margin: 2px 0 0; font-size: 10px;">BRMP SDLAHAN · Kementerian Pertanian RI</p>
            </div>
            <h2 style="color: #1a202c; margin-bottom: 8px;">Permintaan Reset Password</h2>
            <p style="color: #4a5568;">Halo <strong>${user.name || ""}</strong>,</p>
            <p style="color: #4a5568;">Kami menerima permintaan untuk mereset password akun SMART Anda. Klik tombol di bawah untuk melanjutkan:</p>
            <p style="margin: 28px 0;">
              <a href="${url}" style="background-color: #143D32; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Reset Password</a>
            </p>
            <p style="color: #718096; font-size: 13px;">Jika Anda tidak meminta reset password, abaikan email ini. Link ini berlaku selama <strong>1 jam</strong>.</p>
            <hr style="border: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #a0aec0; font-size: 11px; text-align: center;">BRMP SDLAHAN · Kementerian Pertanian RI · TA 2026</p>
          </div>
        `,
        text: `Halo ${user.name || ""}, gunakan link berikut untuk mereset password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    async sendVerificationEmail({ user, url }) {
      await sendMail({
        to: user.email,
        subject: "Verifikasi Email — SMART BRMP SDLAHAN",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
            <div style="background: #143D32; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #fff; margin: 0; font-size: 18px; letter-spacing: 0.2em;">SMART</h1>
              <p style="color: #86efac; margin: 4px 0 0; font-size: 11px;">Sistem Monitoring, Analisis, Reporting & Tracking</p>
            </div>
            <h2 style="color: #1a202c;">Verifikasi Email Anda</h2>
            <p style="color: #4a5568;">Halo <strong>${user.name || ""}</strong>,</p>
            <p style="color: #4a5568;">Terima kasih telah bergabung dengan sistem SMART. Verifikasi email Anda untuk mengaktifkan akun:</p>
            <p style="margin: 28px 0;">
              <a href="${url}" style="background-color: #143D32; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Verifikasi Email</a>
            </p>
            <p style="color: #718096; font-size: 13px;">Link ini berlaku selama <strong>24 jam</strong>.</p>
            <hr style="border: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #a0aec0; font-size: 11px; text-align: center;">BRMP SDLAHAN · Kementerian Pertanian RI · TA 2026</p>
          </div>
        `,
        text: `Halo ${user.name || ""}, verifikasi email Anda: ${url}`,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
      nip: {
        type: "string",
        required: false,
        input: true,
      },
      jabatan: {
        type: "string",
        required: false,
        input: true,
      },
      unitKerja: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  advanced: {
    cookiePrefix: "brmp-sdlp",
  },
});

export type Session = typeof auth.$Infer.Session;
