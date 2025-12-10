import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar automations using cosine similarity
    const { data, error } = await supabase.rpc('search_automations', {
      query_embedding: queryEmbedding,
      match_limit: limit
    });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // DEBUG: Log what's coming from database
    console.log('🔍 SEARCH RESULTS FROM DATABASE:');
    data?.forEach((automation, index) => {
      console.log(`\n${index + 1}. ${automation.name} (${automation.id})`);
      console.log('   required_inputs:', JSON.stringify(automation.required_inputs, null, 2));
      console.log('   required_inputs type:', typeof automation.required_inputs);
      console.log('   required_inputs is array:', Array.isArray(automation.required_inputs));
    });

    return NextResponse.json({ results: data || [] });
  } catch (error) {
    console.error('Automation search error:', error);
    return NextResponse.json(
      { error: 'Failed to search automations', message: error.message },
      { status: 500 }
    );
  }
}
