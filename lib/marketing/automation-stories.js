// What each automation looks like while it is running.
//
// Curated rather than pulled from the database: this is a showcase of a few
// automations told properly, not a listing. An automation published tomorrow
// simply will not appear here — which is the honest trade for stories that are
// actually specific. If this ever needs to cover the whole catalog, it becomes
// a `story` column filled in at publish time, not a longer version of this file.
//
// `match` is the automations.name it pairs with, so the cards stay real.

export const AUTOMATION_STORIES = [
  {
    match: 'Auto Job Matcher',
    label: 'Roles that actually fit',
    // Each beat is one visual moment, not a step in a pipeline.
    beats: [
      { kind: 'input', text: 'Senior frontend · remote · £70k+' },
      { kind: 'scan', text: 'Remotive · Arbeitnow · Jobicy · JSearch' },
      { kind: 'result', items: ['Vercel — Senior FE', 'Linear — Product Eng', 'Raycast — Frontend'] },
    ],
  },
  {
    match: 'Linkedin auto blog poster',
    label: 'Your writing, posted',
    beats: [
      { kind: 'input', text: 'yourblog.com/new-post' },
      { kind: 'scan', text: 'Reading · shortening · formatting' },
      { kind: 'result', items: ['Posted to LinkedIn', '3 min read → 4 paragraphs'] },
    ],
  },
  {
    match: 'Invoice Manager System',
    label: 'Invoices, filed',
    beats: [
      { kind: 'input', text: 'invoice-1042.pdf' },
      { kind: 'scan', text: 'Vendor · date · total · status' },
      { kind: 'result', items: ['Acme Supplies · 12 Mar · £1,240', 'Northwind · 14 Mar · £380'] },
    ],
  },
];

// Pair the curated stories with the live catalog so names, authors and run
// counts stay true. Anything without a matching automation is dropped rather
// than shown with invented data.
export function buildShowcase(automations = []) {
  const byName = new Map(
    automations.map((automation) => [String(automation.name).toLowerCase(), automation])
  );

  return AUTOMATION_STORIES.map((story) => {
    const automation = byName.get(story.match.toLowerCase());
    return automation ? { ...story, automation } : null;
  }).filter(Boolean);
}
