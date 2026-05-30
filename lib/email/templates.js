/**
 * Branded email templates for ModelGrow notifications.
 * Each function returns an { subject, html } object ready for sendEmail().
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modelgrow.com';

// ── Shared layout ──────────────────────────────────────────────────────────────

function layout(bodyContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ModelGrow</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #334155;">
              <span style="font-size:22px;font-weight:700;color:#e2e8f0;letter-spacing:-0.5px;">Model<span style="color:#a78bfa;">Grow</span></span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                You're receiving this because you have an account on
                <a href="${APP_URL}" style="color:#a78bfa;text-decoration:none;">ModelGrow</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:10px;padding:0;">
          <a href="${href}" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// ── Templates ──────────────────────────────────────────────────────────────────

/**
 * Email sent to the RECIPIENT when someone sends them a message request.
 */
export function messageRequestEmail({ senderName, requestTitle, threadId }) {
  const threadUrl = `${APP_URL}/messages?thread=${threadId}`;
  const contextLine = requestTitle
    ? `wants to discuss <strong style="color:#e2e8f0;">"${requestTitle}"</strong> with you`
    : `wants to connect with you`;

  const html = layout(`
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
      Hey there 👋
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;line-height:1.6;">
      <strong style="color:#e2e8f0;">${senderName}</strong> ${contextLine} on ModelGrow.
    </p>
    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;">
      You can accept or decline this message request from your inbox.
    </p>
    ${button(threadUrl, 'View Message Request')}
  `);

  return {
    subject: `${senderName} wants to connect with you on ModelGrow`,
    html,
  };
}

/**
 * Email sent to the SENDER when their message request is accepted.
 */
export function messageAcceptedEmail({ accepterName, threadId }) {
  const threadUrl = `${APP_URL}/messages?thread=${threadId}`;

  const html = layout(`
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
      Great news! 🎉
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;line-height:1.6;">
      <strong style="color:#e2e8f0;">${accepterName}</strong> accepted your message request.
      You can now chat freely.
    </p>
    ${button(threadUrl, 'Open Conversation')}
  `);

  return {
    subject: `${accepterName} accepted your message request`,
    html,
  };
}

/**
 * Email sent when a new message arrives in an active thread.
 */
export function newMessageEmail({ senderName, threadId }) {
  const threadUrl = `${APP_URL}/messages?thread=${threadId}`;

  const html = layout(`
    <p style="margin:0 0 8px;font-size:15px;color:#94a3b8;line-height:1.6;">
      <strong style="color:#e2e8f0;">${senderName}</strong> sent you a new message on ModelGrow.
    </p>
    ${button(threadUrl, 'Read Message')}
  `);

  return {
    subject: `New message from ${senderName}`,
    html,
  };
}

/**
 * Email sent by admins to all users for product updates.
 */
export function adminBroadcastEmail({ title, message }) {
  const safeTitle = title || 'New update from ModelGrow';
  const safeMessage = (message || '').replace(/\n/g, '<br />');

  const html = layout(`
    <p style="margin:0 0 12px;font-size:15px;color:#94a3b8;line-height:1.6;">
      We shipped something new on ModelGrow.
    </p>
    <h2 style="margin:0 0 14px;font-size:22px;line-height:1.35;color:#e2e8f0;font-weight:700;">
      ${safeTitle}
    </h2>
    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.75;">
      ${safeMessage}
    </p>
    ${button(APP_URL, 'Open ModelGrow')}
  `);

  return {
    subject: safeTitle,
    html,
  };
}
