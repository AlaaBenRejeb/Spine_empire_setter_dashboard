"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [statusIndex, setStatusIndex] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const syncLockRef = useRef<string | null>(null);

  const isSuperadmin = 
    user?.email?.toLowerCase() === 'alaabenrejeb.b@icloud.com' || 
    profile?.role === 'superadmin';

  const checkPortalAccess = (userProfile: any) => {
    if (isSuperadmin) return;
    if (!userProfile) return;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) return;
    
    const role = userProfile.role;
    const hasAdminAccess = role === 'admin' || role === 'superadmin';
    const hasSetterAccess = hasAdminAccess || role === 'setter';
    const hasCloserAccess = hasAdminAccess || role === 'closer';

    let isAuthorized = false;
    if (portalType === 'admin') isAuthorized = hasAdminAccess;
    if (portalType === 'setter') isAuthorized = hasSetterAccess;
    if (portalType === 'closer') isAuthorized = hasCloserAccess;

    if (!isAuthorized) {
      const targetPortal = role === 'admin' || role === 'superadmin' ? 'admin' : role || 'setter';
      const targetUrl = PORTAL_MAP[targetPortal] || PORTAL_MAP['setter'];
      if (typeof window !== 'undefined' && !window.location.href.includes(targetUrl.replace('https://', ''))) {
        window.location.href = targetUrl;
      }
    }
  };

  const syncProfile = async (session: any, source: string, timerId: string, isMounted: boolean) => {
    const userId = session?.user?.id;
    if (!userId) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (syncLockRef.current === userId) return;
    syncLockRef.current = userId;

    try {
      setUser(session.user);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!isMounted) return;
      if (error) console.error(`[${timerId}] Profile Fetch Error:`, error);

      if (profileData) {
        setProfile(profileData);
        checkPortalAccess(profileData);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(`[${timerId}] Critical Error during Sync:`, err);
    } finally {
      syncLockRef.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = `AuthSync-${Math.random().toString(36).slice(2, 6)}`;
    let isMounted = true;

    const runInit = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) await syncProfile(session, "INIT", timerId, isMounted);
      } catch (err) {
        console.error(`[${timerId}] Session Fetch Failed:`, err);
        if (isMounted) setLoading(false);
      }
    };

    runInit();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (isMounted) await syncProfile(session, `EVENT_${event}`, timerId, isMounted);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!loading) return;
    const failsafe = setTimeout(() => {
      if (loading) {
        console.warn(`⚠️ Auth Synchronization Timeout: Engaging Fail-safe protocols.`);
        setLoading(false);
      }
    }, 45000); // 45s adaptive failsafe
    return () => clearTimeout(failsafe);
  }, [loading]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % 5);
    }, 2500);
    const showResetTimer = setTimeout(() => setShowReset(true), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(showResetTimer);
    };
  }, [loading]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hardReset = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spine-setter-auth-v1');
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const needsOnboarding = user && !isSuperadmin && profile !== undefined && (profile === null || !profile.first_name || !profile.last_name || !profile.city || !profile.role);
  const isPublicRoute = typeof window !== 'undefined' && (window.location.pathname.startsWith('/join') || window.location.pathname.startsWith('/auth/signup'));

  if (loading) {
    const STATUS_MESSAGES = [
      "Initializing Strategic Command...",
      "Establishing Neural Handshake...",
      "Synchronizing Market Intelligence...",
      "Deploying Global Assets...",
      "Finalizing Nexus Encryption..."
    ];

    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden font-sans relative">
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md px-10">
          <div className="relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-24 h-24 rounded-[2.5rem] border-2 border-white/5 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-[2.5rem] border-t-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full blur-xl" />
            </motion.div>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <AnimatePresence mode="wait">
              <motion.div key={statusIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                <span className="text-[12px] font-black uppercase tracking-[0.5em] text-white leading-loose whitespace-nowrap">{STATUS_MESSAGES[statusIndex]}</span>
              </motion.div>
            </AnimatePresence>
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
               <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 bg-white/20 blur-[1px]" />
            </div>
          </div>
          {showReset && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={hardReset} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all">
              System Reset
            </motion.button>
          )}
          <div className="flex flex-col items-center gap-1 opacity-20 text-white italic text-[7px] font-bold uppercase tracking-[0.3em]">
             Spine Empire Security Node
          </div>
        </div>
      </div>
    );
  }

  if (isPublicRoute) return <AuthContext.Provider value={{ user, profile, loading, isSuperadmin, signOut }}>{children}</AuthContext.Provider>;
  if (!user) return <UnifiedLogin />;
  if (needsOnboarding) return <AuthContext.Provider value={{ user, profile, loading, isSuperadmin, signOut }}>
    <OnboardingPage user={user} onComplete={() => window.location.reload()} />
  </AuthContext.Provider>;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSuperadmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
