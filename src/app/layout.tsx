"use client";

import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
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
  const { activeLead, liveMetaPriorityAlert, dismissMetaPriorityLiveAlert } = useCRM();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  
  // Hide dashboard layout on auth/join pages
  const isAuthPage = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/join') || 
      window.location.pathname.startsWith('/auth/signup')
  );

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex bg-background min-h-screen">
      <MobileHeader 
        isOpen={isMobileMenuOpen} 
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {liveMetaPriorityAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="fixed right-4 top-20 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-[1.5rem] border border-emerald-500/20 bg-black/90 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:right-6 lg:top-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-emerald-300">
                  Fresh Meta Lead
                </span>
                <h3 className="mt-3 text-lg font-heading font-black uppercase italic leading-tight text-white">
                  {liveMetaPriorityAlert.practiceName}
                </h3>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                  Shared queue • {liveMetaPriorityAlert.ageLabel}
                </p>
              </div>

              <button
                onClick={dismissMetaPriorityLiveAlert}
                className="rounded-full border border-white/10 p-2 text-white/45 transition-colors hover:border-white/20 hover:text-white"
                aria-label="Dismiss meta priority alert"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <a
                href="/deals"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-transform hover:-translate-y-0.5 hover:bg-white/90"
              >
                Open Queue
              </a>
              <button
                onClick={dismissMetaPriorityLiveAlert}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/65 transition-colors hover:border-white/20 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col pt-16 lg:pl-64 lg:pt-0">
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <ScriptBuddy activeLead={activeLead} />
    </div>
  );
}

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

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
