'use client';

// What every other automation tool asks for, against what ModelGrow asks for.
//
// Two deliberate decisions:
//   * No arrow, no connector, no path. An arrow between two panels is a pipeline
//     diagram, and a pipeline is the thing customers are running from. The
//     "before" panel instead sits further back in Z and tilts away — depth does
//     the work an arrow would have done.
//   * No sentence explaining it. Seven struck-out credential fields next to two
//     dropdowns is the whole argument; writing "no API keys required" underneath
//     would only be repeating what is already on screen.

const CREDENTIALS = [
  'API_KEY',
  'CLIENT_SECRET',
  'WEBHOOK_URL',
  'OAUTH_REDIRECT',
  'REFRESH_TOKEN',
  'SCOPES[]',
  'payload.json',
];

const CHOICES = ['Which spreadsheet?', 'Which sheet?'];

export default function NoSetupSection() {
  return (
    <section data-ground="dark" id="what-is-modelgrow" className="marketing-anchor mg-nosetup">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Three words. The panels carry the argument; this only anchors them. */}
        <h2 className="mg-nosetup__title marketing-display">Nothing to configure.</h2>

        <div className="mg-nosetup__grid">
          <div className="mg-nosetup__panel mg-nosetup__panel--before">
            <p className="mg-nosetup__label">Everywhere else</p>
            <ul className="mg-nosetup__list">
              {CREDENTIALS.map((field) => (
                <li key={field} className="mg-nosetup__cred">
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mg-nosetup__panel mg-nosetup__panel--after">
            <p className="mg-nosetup__label mg-nosetup__label--here">Here</p>
            <ul className="mg-nosetup__list">
              {CHOICES.map((choice) => (
                <li key={choice} className="mg-nosetup__choice">
                  <span>{choice}</span>
                  <span className="mg-nosetup__tick" aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
