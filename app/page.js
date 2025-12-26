import LandingPageClient from './components/homeComponents/LandingPageClient';

// This is a Server Component - the HTML content here will be visible to Google
export default function Home() {
  return (
    <>
      {/* SEO-friendly content that Google can crawl */}
      <div className="sr-only">
        <h1>ModelGrow - Automation Marketplace</h1>
        <p>
          Discover and run AI-powered automation workflows built with n8n. 
          ModelGrow is your marketplace for ready-made business automations.
          Let's automate your workflow today with intelligent automation solutions.
        </p>
        <h2>Features</h2>
        <ul>
          <li>Browse automation workflows</li>
          <li>AI-powered n8n automations</li>
          <li>No-code business process automation</li>
          <li>Ready-to-deploy workflow templates</li>
        </ul>
      </div>
      
      {/* Client-side interactive landing page */}
      <LandingPageClient />
    </>
  );
}
