import { notificationDB, userDB } from '@/lib/db/supabase-db';
import { displayNameFromUser } from '@/lib/messages/public-user';
import { sendEmail } from '@/lib/email/resend';
import {
  messageRequestEmail,
} from '@/lib/email/templates';

export async function notifyMessageRequest({
  recipientUserId,
  senderPublicUser,
  requestTitle,
  threadId,
}) {
  const recipient = await userDB.getUserById(recipientUserId);
  if (!recipient?.email) return;

  const senderName = displayNameFromUser(senderPublicUser);
  const title = requestTitle ? `"${requestTitle}"` : 'your automation request';

  // In-app notification
  await notificationDB.createNotification({
    user_email: recipient.email,
    message: `${senderName} wants to discuss ${title} privately`,
    type: 'message_request',
    read: false,
    metadata: {
      thread_id: threadId,
      link: `/messages?thread=${threadId}`,
    },
  });

  // Email notification
  const { subject, html } = messageRequestEmail({
    senderName,
    requestTitle,
    threadId,
  });
  await sendEmail({ to: recipient.email, subject, html });
}

export async function notifyMessageAccepted({
  recipientUserId,
  accepterPublicUser,
  threadId,
}) {
  const recipient = await userDB.getUserById(recipientUserId);
  if (!recipient?.email) return;

  const name = displayNameFromUser(accepterPublicUser);

  // In-app notification
  await notificationDB.createNotification({
    user_email: recipient.email,
    message: `${name} accepted your message request`,
    type: 'message_accepted',
    read: false,
    metadata: {
      thread_id: threadId,
      link: `/messages?thread=${threadId}`,
    },
  });


}

export async function notifyNewMessage({
  recipientUserId,
  senderPublicUser,
  threadId,
}) {
  const recipient = await userDB.getUserById(recipientUserId);
  if (!recipient?.email) return;

  const name = displayNameFromUser(senderPublicUser);

  // In-app notification
  await notificationDB.createNotification({
    user_email: recipient.email,
    message: `New message from ${name}`,
    type: 'message',
    read: false,
    metadata: {
      thread_id: threadId,
      link: `/messages?thread=${threadId}`,
    },
  });


}
