"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
  portalType = 'admin' 
}: { 
  children: React.ReactNode, 
  portalType?: 'admin' | 'setter' | 'closer' 
}) {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkPortalAccess = (userProfile: any) => {
    if (!userProfile) return;
    
    const role = userProfile.role;
    const isOwner = user?.email === 'alaabenrejeb.b@gmail.com';
    
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
      
      // Strategic Hierarchy Redirection (Enforced in ALL environments)
      const targetPortal = role === 'admin' || role === 'superadmin' ? 'admin' : role;
      const targetUrl = PORTAL_MAP[targetPortal] || PORTAL_MAP['setter'];
      
      // Strict Gatekeeping: Redirect to authorized terminal
      window.location.href = targetUrl;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
        checkPortalAccess(profileData);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
        checkPortalAccess(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Hierarchy Check
  const isSuperadmin = user?.email === 'alaabenrejeb.b@gmail.com';

  // Determine if onboarding is needed (Removed practice_name check)
  const needsOnboarding = user && (!profile || !profile.first_name || !profile.last_name || !profile.city);

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
