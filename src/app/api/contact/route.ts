import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "nathan@forwardlane.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, budget, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const budgetLabels: Record<string, string> = {
      quickstart: "QuickStart ($1,250)",
      growth: "Growth ($4,800/mo)",
      enterprise: "Enterprise ($25K–$100K+)",
      unsure: "Not sure yet",
    };

    const budgetLabel = budget ? (budgetLabels[budget] || budget) : "Not specified";

    const { error } = await resend.emails.send({
      from: "SignalHaus Contact <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `New Contact: ${name}${company ? ` from ${company}` : ""}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f0f0f; color: #e5e5e5; border-radius: 12px;">
          <h1 style="color: #818cf8; margin-bottom: 24px; font-size: 24px;">New Contact Form Submission</h1>

          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #374151;">
              <td style="padding: 12px 0; color: #9ca3af; font-size: 14px; width: 120px;">Name</td>
              <td style="padding: 12px 0; font-weight: 600;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #374151;">
              <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Email</td>
              <td style="padding: 12px 0;"><a href="mailto:${email}" style="color: #818cf8;">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #374151;">
              <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Company</td>
              <td style="padding: 12px 0;">${company || "—"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #374151;">
              <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Budget</td>
              <td style="padding: 12px 0;">${budgetLabel}</td>
            </tr>
          </table>

          <div style="margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">Message</p>
            <div style="background: #1f2937; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
              ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </div>
          </div>

          <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
            Sent from signalhaus.ai contact form
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
