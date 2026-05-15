const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: automations } = await supabase.from('automations').select('name, author_email').limit(1);
  if (!automations || automations.length === 0) {
    console.log('No automations found');
    return;
  }
  
  const existingName = automations[0].name;
  const author_email = automations[0].author_email;

  const { data, error } = await supabase
    .from('automations')
    .insert({
      name: existingName,
      description: 'test duplicate',
      author_email: author_email,
      workflow: {},
      required_connectors: [],
      required_inputs: [],
      required_scopes: [],
      is_active: false
    })
    .select();

  if (error) {
    console.error('Insert duplicate error:', error);
  } else {
    console.log('Insert duplicate success. Deleting it...');
    await supabase.from('automations').delete().eq('id', data[0].id);
  }
}

check();
