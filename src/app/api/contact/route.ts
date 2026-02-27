import { NextRequest, NextResponse } from "next/server"

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "nathan@forwardlane.com"
const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Mailer not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { name, email, company, budget, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "name, email and message are required" }, { status: 400 })
    }

    const subject = `SignalHaus Contact: ${name}${company ? ` — ${company}` : ''}`

    const html = `
      <h2>New contact from SignalHaus website</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company || '')}</p>
      <p><strong>Budget:</strong> ${escapeHtml(budget || '')}</p>
      <hr />
      <p>${escapeHtml(message)}</p>
    `

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `SignalHaus <no-reply@signalhaus.ai>`,
        to: [CONTACT_EMAIL],
        subject,
        html,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error("Resend error:", resp.status, text)
      return NextResponse.json({ error: "Failed to send email" , details: text }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Contact API error:", err)
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 })
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
