import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamApp - Live Streaming Platform",
  description: "Live streaming platform inspired by Kick.com",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
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
          <LayoutWrapper>
            <Navbar />
            <div className="min-h-screen bg-dark-950">
              {children}
            </div>
          </LayoutWrapper>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#fafafa',
                border: '1px solid #27272a',
              },
              success: {
                iconTheme: {
                  primary: '#FF4E6B',
                  secondary: '#fafafa',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF0436',
                  secondary: '#fafafa',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
