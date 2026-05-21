import { supabase, userDB } from '@/lib/db/supabase-db';

export function displayNameFromUser(user) {
  if (!user) return 'User';
  const name = user.name?.trim();
  if (name) return name;
  return 'User';
}

export async function resolvePublicUserFromAuth(authUser) {
  if (!authUser?.email) return null;
  const dbUser = await userDB.getUserByEmail(authUser.email);
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    profile_image_url: dbUser.profile_image_url,
  };
}

export async function getPublicUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, profile_image_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function toPublicAuthor(userRow) {
  if (userRow?.id) {
    return {
      id: userRow.id,
      display_name: displayNameFromUser(userRow),
      profile_image_url: userRow.profile_image_url || null,
    };
  }
  return {
    id: null,
    display_name: 'User',
    profile_image_url: null,
  };
}

export function sanitizeRequestForPublic(request, authorUserRow) {
  if (!request) return null;
  const {
    author_email,
    author,
    request_comments,
    ...rest
  } = request;

  const commentsCount =
    request.commentsCount ??
    request_comments?.[0]?.count ??
    0;

  return {
    id: rest.id,
    title: rest.title,
    description: rest.description,
    tags: rest.tags,
    created_at: rest.created_at,
    updated_at: rest.updated_at,
    commentsCount,
    author: toPublicAuthor(authorUserRow || author),
    request_id: rest.id,
  };
}

export function sanitizeCommentForPublic(comment, authorUserRow) {
  if (!comment) return null;
  const { author_email, author, ...rest } = comment;
  return {
    id: rest.id,
    request_id: rest.request_id,
    content: rest.content,
    created_at: rest.created_at,
    author: toPublicAuthor(authorUserRow || author),
  };
}

export async function enrichAuthorByEmail(authorEmail) {
  if (!authorEmail) return null;
  return userDB.getUserByEmail(authorEmail);
}
