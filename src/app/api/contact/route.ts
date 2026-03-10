import { NextRequest, NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const CONTACT_EMAIL = process.env.CONTACT_EMAIL
const RESEND_API_KEY = process.env.RESEND_API_KEY
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

// ─── Rate limiter (Upstash Redis in prod, in-memory fallback for local dev) ───
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

function getRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // Fallback to in-memory if Upstash not configured (local dev / preview)
  if (!url || !token) {
    const store = new Map<string, { count: number; resetAt: number }>()
    return {
      limit: async (ip: string) => {
        const now = Date.now()
        const WINDOW = 15 * 60 * 1000
        const MAX = 5
        const entry = store.get(ip)
        if (!entry || now > entry.resetAt) {
          store.set(ip, { count: 1, resetAt: now + WINDOW })
          return { success: true, reset: now + WINDOW }
        }
        if (entry.count >= MAX) {
          return { success: false, reset: entry.resetAt }
        }
        entry.count++
        return { success: true, reset: entry.resetAt }
      },
    }
  }

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: false,
    prefix: "signalhaus_contact",
  })
}

// ─── Validation (Zod-style, no external dep) ──────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BLOCKED_PATTERNS = [/<script/i, /javascript:/i, /on\w+=/i]

interface ContactInput {
  name: string
  email: string
  company?: string
  budget?: string
  message: string
}

interface ValidationResult {
  ok: boolean
  errors?: string[]
  data?: ContactInput
}

function validateContact(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Invalid request body"] }
  }

  const b = body as Record<string, unknown>
  const errors: string[] = []

  // name
  const name = typeof b.name === "string" ? b.name.trim() : ""
  if (!name) errors.push("name is required")
  else if (name.length > 100) errors.push("name must be 100 characters or fewer")

  // email
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : ""
  if (!email) errors.push("email is required")
  else if (!EMAIL_RE.test(email)) errors.push("email is invalid")
  else if (email.length > 254) errors.push("email must be 254 characters or fewer")

  // company (optional)
  const company = typeof b.company === "string" ? b.company.trim() : undefined
  if (company && company.length > 200) errors.push("company must be 200 characters or fewer")

  // budget (optional, whitelist)
  const BUDGET_OPTIONS = [
    "Under $10K", "$10K–$50K", "$50K–$150K", "$150K+", "Not sure", ""
  ]
  const budget = typeof b.budget === "string" ? b.budget.trim() : undefined
  if (budget && !BUDGET_OPTIONS.includes(budget)) errors.push("budget value is not valid")

  // message
  const message = typeof b.message === "string" ? b.message.trim() : ""
  if (!message) errors.push("message is required")
  else if (message.length < 10) errors.push("message must be at least 10 characters")
  else if (message.length > 5000) errors.push("message must be 5000 characters or fewer")

  // XSS / injection guard across all string fields
  const allStrings = [name, email, company ?? "", message]
  for (const val of allStrings) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(val)) {
        errors.push("Input contains disallowed content")
        break
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return { ok: true, data: { name, email, company, budget, message } }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY || !CONTACT_EMAIL) {
    return NextResponse.json({ error: "Mailer not configured" }, { status: 500 })
  }

  // Rate limiting
  const ratelimit = getRatelimit()
  const ip = getClientIp(req)
  const { success, reset } = await ratelimit.limit(ip)
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": "5",
        },
      }
    )
  }

  try {
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    // Validate
    const validation = validateContact(rawBody)
    if (!validation.ok) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 422 })
    }

    const { name, email, company, budget, message } = validation.data!

    const subject = `SignalHaus Contact: ${name}${company ? ` — ${company}` : ''}`

    const html = `
      <h2>New contact from SignalHaus website</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company || 'N/A')}</p>
      <p><strong>Budget:</strong> ${escapeHtml(budget || 'Not specified')}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
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
        reply_to: email,
        subject,
        html,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error("Resend error:", resp.status, text)
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
    }

    // ─── Slack notification (fire-and-forget) ──────────────────────────────
    if (SLACK_WEBHOOK_URL) {
      const budgetLabel = budget ? ` · Budget: *${escapeHtml(budget)}*` : ""
      const companyLabel = company ? ` · ${escapeHtml(company)}` : ""
      const slackPayload = {
        text: `🍯 *New SignalHaus lead!*`,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🍯 New SignalHaus Lead", emoji: true },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${escapeHtml(name)}${companyLabel}` },
              { type: "mrkdwn", text: `*Email:*\n${escapeHtml(email)}` },
            ],
          },
          ...(budget
            ? [
                {
                  type: "section",
                  fields: [{ type: "mrkdwn", text: `*Budget:*\n${escapeHtml(budget)}` }],
                },
              ]
            : []),
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Message:*\n${escapeHtml(message).slice(0, 500)}${message.length > 500 ? "…" : ""}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Reply via Email" },
                url: `mailto:${email}`,
                style: "primary",
              },
            ],
          },
        ],
      }
      // Non-blocking — don't let Slack failure block the response
      fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      }).catch((err) => {
        console.error("Slack webhook error:", err instanceof Error ? err.message : String(err))
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Contact API error:", msg)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
