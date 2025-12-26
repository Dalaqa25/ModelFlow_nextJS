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
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://modelgrow.com",
        siteName: "ModelGrow",
        title: "ModelGrow – Automation Marketplace",
        description: "Discover and run AI-powered automation workflows built with n8n.",
    },
    twitter: {
        card: "summary_large_image",
        title: "ModelGrow – Automation Marketplace",
        description: "Discover and run AI-powered automation workflows built with n8n.",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={inter.className}>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
