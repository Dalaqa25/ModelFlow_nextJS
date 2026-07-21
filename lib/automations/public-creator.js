function titleCaseEmailPrefix(email = '') {
  const prefix = email.split('@')[0] || '';
  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fallbackCreatorName(email) {
  if (!email) return 'ModelGrow community';
  if (email.toLowerCase().includes('modelgrow')) return 'ModelGrow';
  return titleCaseEmailPrefix(email) || 'ModelGrow community';
}

export function toPublicAutomationCreator(user, authorEmail) {
  return {
    id: user?.id || null,
    display_name: user?.name?.trim() || fallbackCreatorName(authorEmail),
    profile_image_url: user?.profile_image_url || null,
  };
}

/**
 * Adds a safe, display-ready creator object to automation records.
 *
 * Some search results only contain an automation ID, so this resolves a
 * missing author_email from the automation table before looking up the
 * creator's public profile.
 */
export async function attachPublicAutomationCreators(supabase, automations = []) {
  if (!Array.isArray(automations) || automations.length === 0) return [];

  const missingAuthorIds = automations
    .filter((automation) => !automation.author_email && automation.id)
    .map((automation) => automation.id);

  const emailByAutomationId = new Map();
  if (missingAuthorIds.length > 0) {
    const { data: authorRows } = await supabase
      .from('automations')
      .select('id, author_email')
      .in('id', missingAuthorIds);

    for (const row of authorRows || []) {
      if (row.author_email) emailByAutomationId.set(row.id, row.author_email);
    }
  }

  const authorEmails = Array.from(new Set(
    automations
      .map((automation) => automation.author_email || emailByAutomationId.get(automation.id))
      .filter(Boolean)
  ));

  const userByEmail = new Map();
  if (authorEmails.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, profile_image_url')
      .in('email', authorEmails);

    for (const user of users || []) {
      if (user.email) userByEmail.set(user.email, user);
    }
  }

  return automations.map((automation) => {
    const authorEmail = automation.author_email || emailByAutomationId.get(automation.id) || null;
    return {
      ...automation,
      creator: toPublicAutomationCreator(userByEmail.get(authorEmail), authorEmail),
    };
  });
}

export function getAutomationCreator(automation) {
  return automation?.creator || toPublicAutomationCreator(null, automation?.author_email);
}

export function getCreatorInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MG';
}
