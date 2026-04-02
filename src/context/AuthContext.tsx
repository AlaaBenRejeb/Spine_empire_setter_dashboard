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

  const checkPortalAccess = (userProfile: any) => {
    if (!userProfile) return;

    // Safety: If they are on localhost, skip automated redirects for development ease
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log("Development Mode: Skipping hierarchy redirection on localhost.");
      return;
    }
    
    const role = userProfile.role;
    const isOwner = user?.email === 'alaabenrejeb.b@icloud.com';
    
    // Hierarchy Enforcement logic
    const hasAdminAccess = isOwner || role === 'admin' || role === 'superadmin';
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
    // Fail-safe: Force resolve loading after 5 seconds to prevent infinite "Syncing" hang
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      console.warn("Auth synchronization timeout: Forcing interface load.");
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileData) {
            setProfile(profileData);
            checkPortalAccess(profileData);
          } else {
            console.log("No profile detected - triggering onboarding.");
            setProfile(null);
          }
        } else {
          setLoading(false); // No session
        }
      } catch (error: any) {
        console.error("Critical Auth Sync Failure:", error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      try {
        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileData) {
            setProfile(profileData);
            checkPortalAccess(profileData);
          } else {
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error: any) {
        console.error("Auth state update error:", error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Hierarchy Check
  const isSuperadmin = user?.email === 'alaabenrejeb.b@icloud.com';

  // Determine if onboarding is needed (More robust check)
  const needsOnboarding = user && profile !== undefined && (profile === null || !profile.first_name || !profile.last_name || !profile.city);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
           <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">Synchronizing Empire...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <UnifiedLogin />;
  }

  if (needsOnboarding) {
    return <OnboardingPage user={user} onComplete={() => window.location.reload()} />;
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
