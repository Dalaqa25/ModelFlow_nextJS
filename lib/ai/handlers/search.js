// Search handler functions
import { generateEmbedding } from '@/lib/ai/embeddings';
import { supabase, sendSSE, parseConnectors } from './shared.js';
import { log, logError } from './shared.js';
import { attachPublicAutomationCreators } from '@/lib/automations/public-creator';
import { extractSearchKeywords, scoreAutomationSearch } from '../search-ranking.js';

// Handle show_user_automations tool - display user's automation instances with stats
export async function handleShowUserAutomations(args, user, controller, encoder) {
  log('[show_user_automations] Called with args:', args);

  try {
    const statusFilter = args.status_filter || 'all';

    // Fetch user's automation instances (now consolidated in user_automations)
    let query = supabase
      .from('user_automations')
      .select(`
        id,
        automation_id,
        parameters,
        is_active,
        last_run_at,
        created_at,
        automations (
          name,
          description,
          token_cost
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'paused') {
      query = query.eq('is_active', false);
    }

    const { data: instances, error } = await query;

    if (error) {
      logError('[show_user_automations] Error:', error);
      sendSSE(controller, encoder, { content: "Sorry, I couldn't fetch your automations. Please try again." });
      return;
    }

    if (!instances || instances.length === 0) {
      sendSSE(controller, encoder, {
        content: statusFilter === 'all'
          ? "You don't have any automations set up yet. I can show you the available automations and help you choose one."
          : `You don't have any ${statusFilter} automations.`
      });
      return;
    }

    // Fetch execution stats for each automation
    const automationsWithStats = await Promise.all(
      instances.map(async (instance) => {
        // Get execution count and success rate
        const { data: executions } = await supabase
          .from('automation_executions')
          .select('status, credits_used')
          .eq('automation_id', instance.automation_id)
          .eq('executed_by', user.email);

        const totalRuns = executions?.length || 0;
        const successfulRuns = executions?.filter(e => e.status === 'success').length || 0;
        const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
        const totalCredits = executions?.reduce((sum, e) => sum + (e.credits_used || 0), 0) || 0;

        return {
          id: instance.id,
          automation_id: instance.automation_id,
          name: instance.automations?.name || 'Unknown Automation',
          description: instance.automations?.description,
          enabled: instance.is_active,
          last_run: instance.last_run_at,
          created_at: instance.created_at,
          config: instance.parameters || {},
          total_runs: totalRuns,
          success_rate: successRate,
          total_credits: totalCredits,
          price_per_run: instance.automations?.token_cost || 0
        };
      })
    );

    // Send the data as a special UI component
    sendSSE(controller, encoder, {
      type: 'automation_instances',
      instances: automationsWithStats
    });

    // Also send a natural language summary
    const activeCount = automationsWithStats.filter(a => a.enabled).length;
    const pausedCount = automationsWithStats.filter(a => !a.enabled).length;

    let summary = `You have ${automationsWithStats.length} automation${automationsWithStats.length !== 1 ? 's' : ''}`;
    if (statusFilter === 'all' && (activeCount > 0 || pausedCount > 0)) {
      summary += ` (${activeCount} active, ${pausedCount} paused)`;
    }
    summary += '. ';

    if (automationsWithStats.length > 0) {
      summary += 'You can enable, disable, or reconfigure any of them.';
    }

    sendSSE(controller, encoder, { content: summary });

  } catch (e) {
    logError('[show_user_automations] Error:', e);
    sendSSE(controller, encoder, { content: "Error fetching automations. Please try again." });
  }
}

// Handle search_automations tool
export async function handleSearchAutomations(args, controller, encoder) {
  // Send searching indicator
  sendSSE(controller, encoder, { type: 'searching', status: 'start' });

  try {
    let searchResults = [];
    const queryLower = String(args?.query || '').toLowerCase();
    const browseAll = Boolean(args?.browse_all);

    const keywords = extractSearchKeywords(queryLower);

    // Detect platform mentions for strict filtering
    const platforms = ['tiktok', 'linkedin', 'twitter', 'instagram', 'youtube', 'facebook', 'google', 'slack', 'discord'];
    const mentionedPlatform = platforms.find(p => queryLower.includes(p));

    log('[SEARCH] Query:', args.query, '| Keywords:', keywords, '| Platform:', mentionedPlatform);

    // STEP 1: Fetch all active automations
    const { data: allActive } = await supabase
      .from('automations')
      .select('id, name, description, required_inputs, required_connectors, token_cost, author_email')
      .eq('is_active', true);

    if (allActive && allActive.length > 0) {
      // STEP 2: Score and filter automations
      //
      // Scoring runs even when the phrasing looked like browsing. Deciding from
      // the wording alone meant "some automation which replies to my emails"
      // matched a browse pattern on "some automation" and returned the first six
      // rows in database order, the query thrown away. What the automations
      // actually do is the better judge, so let them answer first; browsing is
      // what happens below when none of them can.
      const scored = allActive.map(automation => {
        const nameLower = automation.name.toLowerCase();
        const connectors = parseConnectors(automation.required_connectors).map(c => c.toLowerCase());

        // Check if automation matches platform requirement
        const matchesPlatform = !mentionedPlatform ||
          nameLower.includes(mentionedPlatform) ||
          connectors.some(c => c.includes(mentionedPlatform));

        return {
          ...automation,
          matchesPlatform,
          score: scoreAutomationSearch({ automation, connectors, keywords })
        };
      });

      // STEP 3: Filter by platform (if mentioned) and sort by score
      searchResults = scored
        .filter(a => a.matchesPlatform && a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      log('[SEARCH] Scored results:', searchResults.map(r => ({ name: r.name, score: r.score, matches: r.matchesPlatform })));
    }

    // If no results from scoring, try semantic search (but still filter by platform)
    if (searchResults.length === 0) {
      try {
        const queryEmbedding = await generateEmbedding(args.query);
        const { data, error } = await supabase.rpc('search_automations', {
          query_embedding: queryEmbedding,
          match_limit: 5
        });
        if (!error && data) {
          const MINIMUM_SIMILARITY = 0.45; // Higher threshold
          let semanticResults = data.filter(r => r.similarity >= MINIMUM_SIMILARITY);

          // Filter by platform if mentioned
          if (mentionedPlatform) {
            semanticResults = semanticResults.filter(r => {
              const nameLower = r.name.toLowerCase();
              const connectors = parseConnectors(r.required_connectors).map(c => c.toLowerCase());
              return nameLower.includes(mentionedPlatform) || connectors.some(c => c.includes(mentionedPlatform));
            });
          }

          searchResults = semanticResults.slice(0, 3);
        }
      } catch (embeddingError) {
        // Embedding failed, results stay empty
        logError('[SEARCH] Embedding error:', embeddingError);
      }
    }

    // Nothing in the catalogue answered the question — by keyword or by meaning.
    // Showing a sample beats an empty reply, and it is now the last resort
    // rather than a decision made from the wording before searching. browseAll
    // only widens it, so someone who asked to see everything gets more than
    // someone whose specific request happened to miss.
    if (searchResults.length === 0 && allActive?.length) {
      searchResults = allActive.slice(0, browseAll ? 6 : 3);
      log('[SEARCH] No match; showing', searchResults.length, 'from the catalogue');
    }

    const filteredResults = searchResults || [];

    const normalizedResults = await attachPublicAutomationCreators(supabase, filteredResults.map(r => {
      let parsedInputs = r.required_inputs;
      if (Array.isArray(r.required_inputs) && r.required_inputs.length > 0 && typeof r.required_inputs[0] === 'string') {
        try { parsedInputs = r.required_inputs.map(input => JSON.parse(input)); } catch (e) { }
      }
      return { ...r, required_inputs: parsedInputs };
    }));

    // Clear searching indicator
    sendSSE(controller, encoder, { type: 'searching', status: 'end' });

    if (normalizedResults.length > 0) {
      // Send intro text - different messaging for single vs multiple automations
      const isSingleAutomation = normalizedResults.length === 1;
      const introText = isSingleAutomation
        ? "I found an automation that can help!\n\n"
        : "I have some automations that might help!\n\n";
      sendSSE(controller, encoder, { content: introText });

      // Send structured automation list for styled rendering
      const formattedAutomations = normalizedResults.map((automation, index) => {
        const price = automation.token_cost === 0 ? 'Free' : `${(automation.token_cost / 100).toFixed(2)}`;
        const connectors = parseConnectors(automation.required_connectors);
        return {
          index: index + 1,
          name: automation.name,
          price,
          description: automation.description || 'No description',
          requires: connectors.length > 0 ? connectors : ['None'],
          creator: automation.creator,
        };
      });

      sendSSE(controller, encoder, { type: 'automation_list', automations: formattedAutomations });

      // Different call-to-action for single vs multiple automations
      const ctaText = isSingleAutomation
        ? "\nWould you like me to set this up for you?"
        : "\nJust tell me which one you'd like to use!";
      sendSSE(controller, encoder, { content: ctaText });

      // Send automation context for AI to reference later - INCLUDE DESCRIPTIONS so AI doesn't hallucinate!
      const contextStr = normalizedResults.map(a =>
        `- "${a.name}" (UUID: ${a.id})\n  Description: ${a.description || 'No description available'}\n  Requires: ${parseConnectors(a.required_connectors).join(', ') || 'None'}`
      ).join('\n\n');
      sendSSE(controller, encoder, { type: 'automation_context', context: contextStr });
    } else {
      // NO RESULTS - Send popup trigger for community redirect
      sendSSE(controller, encoder, { type: 'no_results_popup', query: args.query });
      sendSSE(controller, encoder, { content: "I couldn't find an automation for that. But don't worry – you can request it in our community!" });
    }
  } catch (e) {
    // Clear searching indicator on error
    sendSSE(controller, encoder, { type: 'searching', status: 'end' });
    sendSSE(controller, encoder, { content: "Sorry, I had trouble searching. Please try again." });
  }
}
