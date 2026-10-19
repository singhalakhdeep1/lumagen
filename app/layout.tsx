import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI Image Generator - Create Stunning AI Art",
    description: "Generate beautiful AI images with advanced prompting, style selection, and image upscaling. Powered by Replicate AI.",
    manifest: "/manifest.json",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    {children}
                    <PwaRegister />
                </Providers>
                <Toaster />
            </body>
        </html>
    );
}
