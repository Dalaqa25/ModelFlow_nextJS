import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeletionWarningEmail({ to, modelName, deletionDate }) {
  try {
    const result = await resend.emails.send({
      from: 'Your App <g.dalaqishvili01@gmail.com>', // Make sure this is verified in Resend
      to,
      subject: `Model Scheduled for Deletion: ${modelName}`,
      html: `
        <h2>Model Scheduled for Deletion</h2>
        <p>The model <strong>${modelName}</strong> is scheduled for deletion on <strong>${deletionDate}</strong>.</p>
        <p>Please download it before this date if you wish to keep a copy.</p>
      `,
    });
    return result;
  } catch (error) {
    console.error('Failed to send deletion warning email:', error);
    throw error;
  }
}