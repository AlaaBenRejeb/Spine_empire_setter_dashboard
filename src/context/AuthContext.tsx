"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UnifiedLogin from "@/components/UnifiedLogin";
import OnboardingPage from "@/components/OnboardingPage";
import { motion, AnimatePresence } from "framer-motion";

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  isSuperadmin: boolean;
  signOut: () => Promise<void>;
}

const PORTAL_MAP: Record<string, string> = {
  admin: "https://adminops.spineempire.com",
  setter: "https://setter.spineempire.com",
  closer: "https://sales.spineempire.com"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  portalType = 'setter' 
}: { 
  children: React.ReactNode, 
  portalType?: 'admin' | 'setter' | 'closer' 
}) {
  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const syncLockRef = React.useRef<string | null>(null);

  // Absolute master bypass for owner (Case-insensitive + Database Role)
  const isSuperadmin = 
    user?.email?.toLowerCase() === 'alaabenrejeb.b@icloud.com' || 
    profile?.role === 'superadmin';

  const checkPortalAccess = (userProfile: any) => {
    // If they are superadmin, they have absolute authority to enter any portal
    if (isSuperadmin) return;
    if (!userProfile) return;

    // Safety: If they are on localhost, skip automated redirects for development ease
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log("Development Mode: Skipping hierarchy redirection on localhost.");
      return;
    }
    
    const role = userProfile.role;
    
    // Hierarchy Enforcement logic
    const hasAdminAccess = role === 'admin' || role === 'superadmin';
    const hasSetterAccess = hasAdminAccess || role === 'setter';
    const hasCloserAccess = hasAdminAccess || role === 'closer';

    let isAuthorized = false;
    if (portalType === 'admin') isAuthorized = hasAdminAccess;
    if (portalType === 'setter') isAuthorized = hasSetterAccess;
    if (portalType === 'closer') isAuthorized = hasCloserAccess;

    if (!isAuthorized) {
      console.warn("Hierarchy Breach: Redirecting to authorized portal...");
      
      const targetPortal = role === 'admin' || role === 'superadmin' ? 'admin' : role || 'setter';
      const targetUrl = PORTAL_MAP[targetPortal] || PORTAL_MAP['setter'];
      
      if (typeof window !== 'undefined' && !window.location.href.includes(targetUrl.replace('https://', ''))) {
        window.location.href = targetUrl;
      }
    }
  };

  useEffect(() => {
    // 1. Instrumentation: Tracking Initialization Life-cycle
    const timerId = `AuthSync-${Math.random().toString(36).slice(2, 6)}`;
    console.time(timerId);
    console.log(`[${timerId}] 🚀 Auth Synchronization Initiated.`);

    let isMounted = true;
    let syncCompleted = false;

    const completeSync = () => {
      if (!syncCompleted) {
        syncCompleted = true;
        setLoading(false);
        console.timeEnd(timerId);
      }
    };

    const syncProfile = async (session: any, source: string) => {
      const userId = session?.user?.id;
      
      if (!userId) {
        setUser(null);
        setProfile(null);
        completeSync();
        return;
      }

      // 🔐 GATEKEEPER: Prevent parallel syncs for the same identity
      if (syncLockRef.current === userId) {
        console.log(`[${timerId}] 🛡️ Sync Lock active for ${userId} (Source: ${source}). Skipping redundant fetch.`);
        return;
      }
      
      syncLockRef.current = userId;

      try {
        console.log(`[${timerId}] 🔍 Fetching Profile for Identity: ${userId} (Source: ${source})`);
        setUser(session.user);
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (!isMounted) return;

        if (error) {
          console.error(`[${timerId}] ❌ Profile Fetch Error:`, error);
        }

        if (profileData) {
          console.log(`[${timerId}] ✅ Profile Locked:`, profileData.role);
          setProfile(profileData);
          checkPortalAccess(profileData);
        } else {
          console.warn(`[${timerId}] ⚠️ No Profile Detected: Onboarding required.`);
          setProfile(null);
        }
      } catch (err) {
        console.error(`[${timerId}] 🧨 Critical Error during Sync:`, err);
      } finally {
        syncLockRef.current = null; // Release lock
        completeSync();
      }
    };

    // Unified Initialization: Handle both initial state and subsequent changes
    const runInit = async () => {
      console.log(`[${timerId}] 🛠️ Checking existing session...`);
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) await syncProfile(session, "INIT");
    };

    runInit();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log(`[${timerId}] ⚡ Auth Event Detected: ${event}`);
      if (isMounted) await syncProfile(session, `EVENT_${event}`);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Strategic Failsafe: Infinite Sync Protection (Adaptive to Lock Contention)
  useEffect(() => {
    if (!loading) return;

    // Detect if the client is currently "Locked" waiting for storage access
    // This is common in multi-tab development environments
    const checkLockStatus = () => {
      const isCurrentlyLocked = typeof window !== 'undefined' && 
        document.documentElement.innerHTML.includes('Lock "lock:spine-setter-auth-v1" was not released');
      return isCurrentlyLocked;
    };

    const timeoutDuration = checkLockStatus() ? 30000 : 20000; // Extend if lock contention detected

    const failsafe = setTimeout(() => {
      if (loading) {
        console.warn(`⚠️ Auth Synchronization Timeout (${timeoutDuration}ms): Engaging Fail-safe protocols.`);
        setLoading(false);
      }
    }, timeoutDuration);

    return () => clearTimeout(failsafe);
  }, [loading]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Determine if onboarding is needed (More robust check)
  const needsOnboarding = user && !isSuperadmin && profile !== undefined && (profile === null || !profile.first_name || !profile.last_name || !profile.city);

  // Handle Public Routes (Join / Signup)
  const isPublicRoute = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/join') || 
    window.location.pathname.startsWith('/auth/signup')
  );

  const [statusIndex, setStatusIndex] = useState(0);
  const STATUS_MESSAGES = [
    "Initializing Strategic Command...",
    "Establishing Neural Handshake...",
    "Synchronizing Market Intelligence...",
    "Deploying Global Assets...",
    "Finalizing Nexus Encryption..."
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden font-sans">
        {/* Ambient Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md px-10">
          {/* Animated Core */}
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-[2.5rem] border-2 border-white/5 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 rounded-[2.5rem] border-t-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
               <div className="w-8 h-8 bg-white rounded-full blur-xl" />
            </motion.div>
          </div>

          {/* Dynamic Intel Feed */}
          <div className="flex flex-col items-center gap-3 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={statusIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <span className="text-[12px] font-black uppercase tracking-[0.5em] text-white leading-loose whitespace-nowrap">
                  {STATUS_MESSAGES[statusIndex]}
                </span>
              </motion.div>
            </AnimatePresence>
            
            {/* Progress Micro-bar */}
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute inset-0 bg-white/20 blur-[1px]"
               />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 opacity-20">
             <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-white italic">Spine Empire Security Node</span>
             <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 bg-white rounded-full" 
                  />
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Allow public routes to bypass auth requirement
  if (isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user, profile, loading, isSuperadmin, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (!user) {
    return <UnifiedLogin />;
  }

  // Mandatory Onboarding (Bypassed for Superadmin)
  if (needsOnboarding) {
    return (
      <AuthContext.Provider value={{ user, profile, loading, isSuperadmin, signOut }}>
        <OnboardingPage user={user} onComplete={() => window.location.reload()} />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSuperadmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
