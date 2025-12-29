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
    description: "Discover and run AI-powered automation workflows built with n8n. Browse, purchase, and deploy ready-made automations to streamline your business processes.",
    keywords: ["ModelGrow", "automation", "n8n", "workflow", "AI automation", "marketplace", "no-code", "business automation"],
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
        description: "Discover and run AI-powered automation workflows built with n8n.",
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
        description: "Discover and run AI-powered automation workflows built with n8n.",
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
    description: 'Discover and run AI-powered automation workflows built with n8n. Browse, purchase, and deploy ready-made automations.',
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
