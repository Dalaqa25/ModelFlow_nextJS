import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getParticipantUserIds(threadId) {
  const { data, error } = await supabase
    .from('dm_participants')
    .select('user_id')
    .eq('thread_id', threadId);
  if (error) throw error;
  return (data || []).map((p) => p.user_id);
}

export const messageDB = {
  async findThreadBetweenUsersOnRequest(requestId, userIdA, userIdB) {
    const { data: threads, error } = await supabase
      .from('dm_threads')
      .select('id, status, request_id, created_by_user_id, created_at, updated_at')
      .eq('request_id', requestId)
      .neq('status', 'declined');

    if (error) throw error;
    if (!threads?.length) return null;

    for (const thread of threads) {
      const participantIds = await getParticipantUserIds(thread.id);
      const pair = [userIdA, userIdB].sort().join(':');
      const existing = [...participantIds].sort().join(':');
      if (pair === existing && participantIds.length === 2) {
        return thread;
      }
    }
    return null;
  },

  async createThread({ requestId, createdByUserId, recipientUserId, initialBody }) {
    const { data: thread, error: threadError } = await supabase
      .from('dm_threads')
      .insert({
        request_id: requestId || null,
        status: 'pending',
        created_by_user_id: createdByUserId,
      })
      .select()
      .single();

    if (threadError) throw threadError;

    const participants = [createdByUserId, recipientUserId];
    const { error: partError } = await supabase.from('dm_participants').insert(
      participants.map((user_id) => ({ thread_id: thread.id, user_id }))
    );
    if (partError) throw partError;

    const { data: message, error: msgError } = await supabase
      .from('dm_messages')
      .insert({
        thread_id: thread.id,
        sender_user_id: createdByUserId,
        body: initialBody.trim(),
      })
      .select()
      .single();

    if (msgError) throw msgError;

    return { thread, message };
  },

  async getThreadById(threadId) {
    const { data, error } = await supabase
      .from('dm_threads')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async isParticipant(threadId, userId) {
    const { data, error } = await supabase
      .from('dm_participants')
      .select('user_id')
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async listThreadsForUser(userId, status) {
    const { data: memberships, error: memError } = await supabase
      .from('dm_participants')
      .select('thread_id, last_read_at')
      .eq('user_id', userId);

    if (memError) throw memError;
    if (!memberships?.length) return [];

    const threadIds = memberships.map((m) => m.thread_id);
    let query = supabase
      .from('dm_threads')
      .select(`
        id,
        request_id,
        status,
        created_by_user_id,
        created_at,
        updated_at,
        request:requests(id, title)
      `)
      .in('id', threadIds)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: threads, error } = await query;
    if (error) throw error;

    const readMap = Object.fromEntries(
      memberships.map((m) => [m.thread_id, m.last_read_at])
    );

    const enriched = [];
    for (const thread of threads || []) {
      const participantIds = await getParticipantUserIds(thread.id);
      const otherUserId = participantIds.find((id) => id !== userId);

      const { data: lastMessage } = await supabase
        .from('dm_messages')
        .select('id, body, sender_user_id, created_at')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unreadCount } = await supabase
        .from('dm_messages')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .gt('created_at', readMap[thread.id] || '1970-01-01')
        .neq('sender_user_id', userId);

      enriched.push({
        ...thread,
        other_user_id: otherUserId,
        last_message: lastMessage,
        unread_count: unreadCount || 0,
        is_incoming_request:
          thread.status === 'pending' &&
          thread.created_by_user_id !== userId,
      });
    }

    return enriched;
  },

  async getMessages(threadId, limit = 100) {
    const { data, error } = await supabase
      .from('dm_messages')
      .select('id, thread_id, sender_user_id, body, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async addMessage(threadId, senderUserId, body) {
    const { data, error } = await supabase
      .from('dm_messages')
      .insert({
        thread_id: threadId,
        sender_user_id: senderUserId,
        body: body.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('dm_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    return data;
  },

  async updateThreadStatus(threadId, status) {
    const { data, error } = await supabase
      .from('dm_threads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markThreadRead(threadId, userId) {
    const { error } = await supabase
      .from('dm_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};

export { supabase as messageSupabase };
