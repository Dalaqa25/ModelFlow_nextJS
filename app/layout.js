import "./globals.css";
import "./globals-light.css";
import { Inter } from 'next/font/google';
import ClientProviders from "./client-providers";

const inter = Inter({
    subsets: ['latin'],
    display: 'swap'
});

export const metadata = {
    title: "ModelGrow – Run Powerful Automations with AI",
    description: "Discover community-built workflows, launch them through chat, and earn when others use the automations you publish.",
    keywords: ["ModelGrow", "AI automation marketplace", "workflow automation", "automation marketplace", "pre-built automations", "AI search", "no-code automations", "creator marketplace"],
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
        title: "ModelGrow – Run Powerful Automations with AI",
        description: "Discover community-built workflows, launch them through chat, and earn when others use the automations you publish.",
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
        title: "ModelGrow – Run Powerful Automations with AI",
        description: "Discover community-built workflows, launch them through chat, and earn when others use the automations you publish.",
        images: ['/logo.png'],
    },
};

// JSON-LD structured data for Google Search
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ModelGrow',
    alternateName: 'ModelGrow AI Automation Marketplace',
    url: 'https://modelgrow.com',
    description: 'Discover community-built workflows, launch them through chat, and earn when others use the automations you publish.',
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
            <body className={inter.className} suppressHydrationWarning>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
