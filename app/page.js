import { createClient } from '@supabase/supabase-js';
import MarketingLanding from '@/app/components/marketing/MarketingLanding';

// Fetched on the server so the wall is in the first paint. The role picker then
// filters what is already on the page instead of firing a request per click.
export const revalidate = 300;

async function getAutomations() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('automations')
      .select('id, name, description, author_email, total_runs, required_connectors')
      .eq('is_active', true)
      .order('total_runs', { ascending: false })
      .limit(60);

    if (error) throw error;
    return data || [];
  } catch (error) {
    // The landing page has to render even when the catalog query fails; the
    // wall hides itself rather than taking the whole page down with it.
    console.error('[landing] could not load automations:', error.message);
    return [];
  }
}

export default async function Home() {
  const automations = await getAutomations();
  return <MarketingLanding automations={automations} />;
}
