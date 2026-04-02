"use client";

import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ScriptBuddy from "@/components/ScriptBuddy";
import { ThemeProvider } from "@/context/ThemeContext";
import { CRMProvider, useCRM } from "@/context/CRMContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeLead } = useCRM();
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        {children}
      </div>
      <ScriptBuddy activeLead={activeLead} />
    </div>
  );
}

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <head>
        <title>Setter Spine Empire</title>
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider portalType="setter">
            <CRMProvider>
              <AppLayout>{children}</AppLayout>
            </CRMProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
