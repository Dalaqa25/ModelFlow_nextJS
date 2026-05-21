import { displayNameFromUser, getPublicUserById } from '@/lib/messages/public-user';

export async function attachOtherUserToThreads(threads, currentUserId) {
  return Promise.all(
    threads.map(async (thread) => {
      const otherUser = thread.other_user_id
        ? await getPublicUserById(thread.other_user_id)
        : null;
      return {
        id: thread.id,
        status: thread.status,
        request_id: thread.request_id,
        request_title: thread.request?.title || null,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        is_incoming_request: thread.is_incoming_request,
        unread_count: thread.unread_count,
        last_message: thread.last_message
          ? {
              body: thread.last_message.body,
              created_at: thread.last_message.created_at,
              is_mine: thread.last_message.sender_user_id === currentUserId,
            }
          : null,
        other_user: otherUser
          ? {
              id: otherUser.id,
              display_name: displayNameFromUser(otherUser),
              profile_image_url: otherUser.profile_image_url,
            }
          : { id: null, display_name: 'User', profile_image_url: null },
      };
    })
  );
}

export async function attachSendersToMessages(messages, currentUserId) {
  const cache = new Map();
  const result = [];

  for (const msg of messages) {
    if (!cache.has(msg.sender_user_id)) {
      cache.set(msg.sender_user_id, await getPublicUserById(msg.sender_user_id));
    }
    const sender = cache.get(msg.sender_user_id);
    result.push({
      id: msg.id,
      body: msg.body,
      created_at: msg.created_at,
      is_mine: msg.sender_user_id === currentUserId,
      sender: {
        id: msg.sender_user_id,
        display_name: displayNameFromUser(sender),
        profile_image_url: sender?.profile_image_url || null,
      },
    });
  }

  return result;
}
