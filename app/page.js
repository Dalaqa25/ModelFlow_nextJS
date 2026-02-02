import LandingPageClient from './components/homeComponents/LandingPageClient';

export const metadata = {
  title: 'ModelGrow - Business Automation Platform | Connect Google Services',
  description: 'Automate your business workflows with ModelGrow. Connect Google Drive, Gmail, Sheets, Calendar, and more. Pre-built automations for invoice processing, email management, document generation, and data synchronization.',
  keywords: 'automation platform, business automation, Google Drive automation, Gmail automation, Google Sheets automation, workflow automation, n8n, no-code automation, business process automation',
  openGraph: {
    title: 'ModelGrow - Business Automation Platform',
    description: 'Automate your business workflows with pre-built integrations for Google services and more.',
    type: 'website',
  },
};

// This is a Server Component - the HTML content here will be visible to Google
export default function Home() {
  return (
    <>
      {/* SEO-friendly content that Google can crawl */}
      <div className="sr-only">
        <h1>ModelGrow - AI Automation Platform for Business Workflows</h1>
        <p>
          ModelGrow is a comprehensive automation platform that connects your business tools and automates workflows. 
          Discover and run pre-built automation workflows that integrate with Google Drive, Gmail, Google Sheets, 
          Google Calendar, YouTube, Google Docs, and other popular services.
        </p>
        <h2>What ModelGrow Does</h2>
        <p>
          Our platform allows you to automate repetitive business tasks by connecting your Google account and other services. 
          Create powerful workflows that automatically process files, send emails, update spreadsheets, manage calendars, 
          and more - all without writing code.
        </p>
        <h2>Key Features</h2>
        <ul>
          <li>Pre-built automation workflows for common business tasks</li>
          <li>Secure Google OAuth integration for Drive, Gmail, Sheets, Calendar, YouTube, Docs, Slides, Forms, and Tasks</li>
          <li>AI-powered automation discovery and matching</li>
          <li>No-code business process automation</li>
          <li>Invoice processing, email automation, document generation, and more</li>
          <li>Built on n8n workflow technology</li>
          <li>Ready-to-deploy workflow templates</li>
        </ul>
        <h2>How It Works</h2>
        <ol>
          <li>Describe your automation need in plain English</li>
          <li>Our AI finds the perfect pre-built automation</li>
          <li>Connect your Google account securely via OAuth</li>
          <li>Run your automation and save hours of manual work</li>
        </ol>
        <h2>Google Services Integration</h2>
        <p>
          ModelGrow integrates with Google services to automate your workflows. When you connect your Google account, 
          you grant ModelGrow permission to access specific Google services needed for your automations. We use OAuth 2.0 
          for secure authentication and only access the data necessary for your chosen automations to function.
        </p>
        <h2>Privacy and Security</h2>
        <p>
          Your data security is our priority. We use industry-standard encryption, secure OAuth authentication, 
          and comply with Google API Services User Data Policy. We never sell your data or use it for purposes 
          other than providing the automation services you request. You can revoke access at any time.
        </p>
        <h2>For Developers</h2>
        <p>
          Are you an n8n developer? Join our team and build automations that help thousands of businesses. 
          We're looking for talented developers to create innovative workflow solutions.
        </p>
      </div>
      
      {/* Client-side interactive landing page */}
      <LandingPageClient />
    </>
  );
}
