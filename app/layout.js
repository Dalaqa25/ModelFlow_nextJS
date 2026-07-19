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
    description: "Discover workflows, launch them through chat, and publish automations that others can use.",
    keywords: ["ModelGrow", "workflow automation", "pre-built automations", "AI search", "no-code automations", "automation builder"],
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
        description: "Discover workflows, launch them through chat, and publish automations that others can use.",
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
        description: "Discover workflows, launch them through chat, and publish automations that others can use.",
        images: ['/logo.png'],
    },
};

// JSON-LD structured data for Google Search
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ModelGrow',
    alternateName: 'ModelGrow AI Automation Platform',
    url: 'https://modelgrow.com',
    description: 'Discover workflows, launch them through chat, and publish automations that others can use.',
    potentialAction: {
        '@type': 'SearchAction',
        target: 'https://modelgrow.com/community?search={search_term_string}',
        'query-input': 'required name=search_term_string',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var mode=localStorage.getItem('themeMode')||'system';var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var root=document.documentElement;root.classList.toggle('dark',dark);root.classList.toggle('light',!dark);root.style.colorScheme=dark?'dark':'light';}catch(e){}})();`,
                    }}
                />
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
