import { Resend } from 'resend';

let _resend = null;

function getResendClient() {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[email] RESEND_API_KEY is not set — emails will be skipped');
      return null;
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const FROM_ADDRESS = 'ModelGrow <notifications@send.modelgrow.com>';

/**
 * Send an email via Resend.
 * Silently logs and returns null if the API key is missing or sending fails,
 * so it never breaks the caller flow.
 */
export async function sendEmail({ to, subject, html }) {
  const resend = getResendClient();
  if (!resend) return null;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[email] Failed to send:', err.message);
    return null;
  }
}
