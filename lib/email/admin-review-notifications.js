import { sendEmail } from './resend';
import { automationReviewRequestedEmail } from './templates';

const DEFAULT_REVIEW_RECIPIENT = 'g.dalaqishvili01@gmail.com';

function getReviewRecipients() {
  const configured = process.env.AUTOMATION_REVIEW_EMAIL_TO ||
    process.env.ADMIN_REVIEW_EMAIL_TO ||
    DEFAULT_REVIEW_RECIPIENT;

  return String(configured)
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function notifyAutomationReviewRequested({
  automation,
  authorEmail,
  source,
}) {
  const recipients = getReviewRecipients();
  if (recipients.length === 0 || !automation) return null;

  const email = automationReviewRequestedEmail({
    automationName: automation.name,
    automationId: automation.id,
    authorEmail: authorEmail || automation.author_email,
    description: automation.description,
    source,
  });

  return sendEmail({
    to: recipients,
    subject: email.subject,
    html: email.html,
  });
}
