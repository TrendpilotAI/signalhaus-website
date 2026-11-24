import { isFlagOn, readiness, type LeadSink } from "../pipeline";
import { topicLabel } from "../schema";

const MESSAGE_PREVIEW_LENGTH = 500;

/** Slack reads &, < and > as control characters in mrkdwn. */
function escapeSlack(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Slack notification through an incoming webhook.
 * Off unless LEAD_SLACK_ENABLED is exactly "true". Once it is, it needs
 * SLACK_WEBHOOK_URL.
 *
 * Slack only notifies. A message in a channel is not where a lead is kept, so
 * a Slack delivery on its own never makes a submission count.
 */
export const slackSink: LeadSink = {
  name: "slack",
  kind: "notify",
  readiness: (env) =>
    readiness(isFlagOn(env.LEAD_SLACK_ENABLED), env.SLACK_WEBHOOK_URL ? [] : ["SLACK_WEBHOOK_URL"]),
  async deliver(lead, { env, fetch }) {
    const webhookUrl = env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("SLACK_WEBHOOK_URL is not set");

    const preview =
      lead.workingOn.length > MESSAGE_PREVIEW_LENGTH
        ? `${lead.workingOn.slice(0, MESSAGE_PREVIEW_LENGTH)}...`
        : lead.workingOn;
    const who = [lead.name, lead.company].filter(Boolean).join(", ");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New Signalhaus lead: ${escapeSlack(lead.name)}`,
        blocks: [
          { type: "header", text: { type: "plain_text", text: "New Signalhaus lead" } },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Who*\n${escapeSlack(who)}` },
              { type: "mrkdwn", text: `*Email*\n${escapeSlack(lead.email)}` },
              { type: "mrkdwn", text: `*Topic*\n${escapeSlack(topicLabel(lead.topic))}` },
              {
                type: "mrkdwn",
                text: `*Source*\n${escapeSlack(lead.attribution.leadSource)} on ${escapeSlack(lead.attribution.pagePath)}`,
              },
            ],
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*What they're working on*\n${escapeSlack(preview)}` },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack responded with ${response.status}`);
    }
  },
};
