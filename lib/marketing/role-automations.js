// Roles a visitor recognises themselves in, mapped to automations that already
// exist in the catalog.
//
// The picker exists because the old hero asked people to type what they want to
// automate, which only works for someone who already knows the answer. Choosing
// "I make videos" needs recognition, not articulation.
//
// Ordered by how well the catalog actually serves each role — an empty result is
// worse than never asking, so a role only ships once there is something real
// behind it. Roles we cannot serve yet live in UNSERVED_ROLES below and become
// the brief for creators instead of a dead end for buyers.

export const ROLES = [
  {
    id: 'creator',
    label: 'I make videos',
    blurb: 'Short-form, YouTube, TikTok',
    automations: [
      'Hook Generator',
      'Thumbnail Generator',
      'Auto Caption Generator',
      'Viral Pattern Detector',
      'Content Repurposing Engine',
      'Trend-to-Script Converter',
    ],
  },
  {
    id: 'editor',
    label: 'I edit them',
    blurb: 'Pacing, b-roll, framing',
    automations: [
      'Video Pacing Analyzer',
      'B-Roll Suggestion Engine',
      'Transition Timing Calculator',
      'Storyboard Generator',
      'Aspect Ratio & Framing Guide',
      'Retention Curve Predictor',
    ],
  },
  {
    id: 'creator-business',
    label: 'I get paid for it',
    blurb: 'Brand deals, rates, contracts',
    automations: [
      'Brand Deal Email Generator',
      'Rate Card Builder',
      'Content Contract Simplifier',
      'Creator Income Tracker Template',
      'Monetization Strategy Planner',
    ],
  },
  {
    id: 'growth',
    label: 'I want more reach',
    blurb: 'Posting, hashtags, positioning',
    automations: [
      'Posting Time Recommender',
      'Hashtag Strategy Builder',
      'Audience Persona Builder',
      'Niche Content Idea Engine',
      '90-Day Growth Sprint Planner',
      'Cross-Promotion Strategy Builder',
    ],
  },
  {
    id: 'admin',
    label: 'I run the business side',
    blurb: 'Invoices, paperwork',
    automations: [
      'Invoice Inbox to Google Sheets',
      'Invoice Manager System',
    ],
  },
  {
    id: 'job-hunt',
    label: "I'm looking for work",
    blurb: 'Roles, LinkedIn presence',
    automations: [
      'Auto Job Matcher',
      'LinkedIn Personal Blog Poster',
      'Linkedin auto blog poster',
    ],
  },
];

// Asked for by visitors, not yet covered by the catalog. Surfacing these to
// creators is the point — a role with no automations is a brief, not a failure.
export const UNSERVED_ROLES = [
  'Online store',
  'Agency',
  'Restaurant',
  'Clinic',
  'Real estate',
];

export function automationsForRole(roleId, automations = []) {
  const role = ROLES.find((candidate) => candidate.id === roleId);
  if (!role) return [];

  const wanted = new Map(role.automations.map((name, index) => [name.toLowerCase(), index]));
  return automations
    .filter((automation) => wanted.has(String(automation.name || '').toLowerCase()))
    .sort(
      (a, b) =>
        wanted.get(String(a.name).toLowerCase()) - wanted.get(String(b.name).toLowerCase())
    );
}
