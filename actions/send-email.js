"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  console.log("Attempting to send email to:", to);
  console.log("Email subject:", subject);

  const resend = new Resend(process.env.RESEND_API_KEY || "");

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set in environment variables");
    return { success: false, error: "RESEND_API_KEY is not set" };
  }

  try {
    console.log("Sending email via Resend...");
    const data = await resend.emails.send({
      from: "Finance App <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { 
      success: false, 
      error: error.message || "Failed to send email",
      details: error
    };
  }
}
