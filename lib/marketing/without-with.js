// The same comparison, told for whoever is reading it.
//
// One fixed example would make ModelGrow look like a tool for that one job —
// the catalog is mostly creator work, so anchoring on invoices reads wrong to
// most visitors. The structure repeating across very different jobs is what
// says "this works for anything"; the content underneath is hand-written per
// role, matched to automations that actually exist.
//
// `role` pairs with the ids in role-automations.js so the picker can lock this
// section to whoever the visitor said they are.

export const COMPARISONS = [
  {
    role: 'creator',
    job: 'video',
    manual: {
      cost: 'About 25 minutes',
      unit: 'every video',
      steps: [
        'Watch the whole thing back',
        'Find the moment that hooks',
        'Write five variations',
        'Pick one and retype the title',
        'Second-guess it',
      ],
    },
    automated: {
      ask: 'Write hooks for this video',
      automation: 'Hook Generator',
      settled: 'Connect once',
    },
  },
  {
    role: 'creator-business',
    job: 'brand deal',
    manual: {
      cost: 'About 40 minutes',
      unit: 'every enquiry',
      steps: [
        'Dig out your last rate card',
        'Work out what to charge this time',
        'Write the pitch from scratch',
        'Re-read it four times',
        'Send it and hope',
      ],
    },
    automated: {
      ask: 'Draft a reply to this brand',
      automation: 'Brand Deal Email Generator',
      settled: 'Connect once',
    },
  },
  {
    role: 'admin',
    job: 'invoice',
    manual: {
      cost: 'About 8 minutes',
      unit: 'every invoice',
      steps: [
        'Open the email',
        'Download the attachment',
        'Find the vendor, date and total',
        'Copy them into the sheet',
        'Check it again',
      ],
    },
    automated: {
      ask: 'Save invoices to my spreadsheet',
      automation: 'Invoice Manager System',
      settled: 'Connect once',
    },
  },
  {
    role: 'job-hunt',
    job: 'job search',
    manual: {
      cost: 'About 40 minutes',
      unit: 'every day',
      steps: [
        'Open four job boards',
        'Filter each one separately',
        'Read thirty listings',
        'Save the three that fit',
        'Do it again tomorrow',
      ],
    },
    automated: {
      ask: 'Find me matching roles',
      automation: 'Auto Job Matcher',
      settled: 'Connect once',
    },
  },
];

export function comparisonForRole(roleId) {
  return COMPARISONS.find((entry) => entry.role === roleId) || null;
}
