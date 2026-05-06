import "./globals.css";
import "./globals-light.css";
import { Inter } from 'next/font/google';
import ClientProviders from "./client-providers";

const inter = Inter({
    subsets: ['latin'],
    display: 'swap'
});

export const metadata = {
    title: "ModelGrow – Automation Marketplace",
    description: "Find and run pre-built automations built by developers. Describe what you need — our AI searches the marketplace and finds the right automation for you.",
    keywords: ["ModelGrow", "automation marketplace", "pre-built automations", "AI search", "workflow automation", "no-code", "automation discovery", "SaaS"],
    authors: [{ name: "ModelGrow" }],
    creator: "ModelGrow",
    publisher: "ModelGrow",
    metadataBase: new URL('https://modelgrow.com'),
    alternates: {
        canonical: '/',
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/logo.png', type: 'image/png' },
        ],
        apple: '/logo.png',
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://modelgrow.com",
        siteName: "ModelGrow",
        title: "ModelGrow – Automation Marketplace",
        description: "Find and run pre-built automations. Describe what you need — our AI finds the right automation for you.",
        images: [
            {
                url: '/logo.png',
                width: 512,
                height: 512,
                alt: 'ModelGrow Logo',
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "ModelGrow – Automation Marketplace",
        description: "Find and run pre-built automations. Describe what you need — our AI finds the right automation for you.",
        images: ['/logo.png'],
    },
};

// JSON-LD structured data for Google Search
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ModelGrow',
    alternateName: 'ModelGrow Automation Marketplace',
    url: 'https://modelgrow.com',
    description: 'Find and run pre-built automations built by developers. Describe what you need — our AI searches the marketplace and finds the right automation for you.',
    potentialAction: {
        '@type': 'SearchAction',
        target: 'https://modelgrow.com/community?search={search_term_string}',
        'query-input': 'required name=search_term_string',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className={inter.className}>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
