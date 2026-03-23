import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import ChatPanel from "@/components/layout/ChatPanel";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "sunOS",
  description: "sunOS — AI platform with solar system visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} data-theme="dark" suppressHydrationWarning>
      <body className="antialiased bg-void text-text-primary">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded"
            style={{ backgroundColor: 'var(--sun)', color: 'var(--void)' }}
          >
            Pular para conteúdo
          </a>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {children}
            </div>
            <ChatPanel />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
